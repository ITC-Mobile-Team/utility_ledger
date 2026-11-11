// Google Sign-In на iOS бере GoogleSignIn через SPM (як і Firebase 13).
// Precompiled modules Expo SDK 58 збирають pod RNGoogleSignin статичною
// бібліотекою. Спільні з Firebase SPM-продукти (GTMSessionFetcherCore,
// GULUserDefaults) Xcode тоді збирає окремими динамічними package-фреймворками,
// але лінкує їх лише в таргети, що оголошують ці продукти, — а застосунок їх не
// оголошує, і лінкування падає з `Undefined symbol _OBJC_CLASS_$_GTMSessionFetcher`
// та `_OBJC_CLASS_$_GULUserDefaults`.
// Плагін у post_install Podfile додає ці продукти до таргета застосунку
// (пакети з тими самими мажорними версіями, що їх уже тягнуть GoogleSignIn 10 і
// Firebase 13), тож Xcode лінкує їх у застосунок.
const { withPodfile } = require('expo/config-plugins');

const MARKER = '# @utility-ledger google-signin-spm-link';

const SNIPPET = `    ${MARKER}
    [
      ['https://github.com/google/gtm-session-fetcher.git', '5.0.0', ['GTMSessionFetcherCore']],
      ['https://github.com/google/GoogleUtilities.git', '8.0.0', ['GULUserDefaults']],
    ].each do |url, min_version, products|
      installer.aggregate_targets.each do |aggregate|
        project = aggregate.user_project
        pkg = project.root_object.package_references.find do |ref|
          ref.respond_to?(:repositoryURL) && ref.repositoryURL == url
        end
        unless pkg
          pkg = project.new(Xcodeproj::Project::Object::XCRemoteSwiftPackageReference)
          pkg.repositoryURL = url
          pkg.requirement = { 'kind' => 'upToNextMajorVersion', 'minimumVersion' => min_version }
          project.root_object.package_references << pkg
        end
        aggregate.user_targets.each do |target|
          products.each do |product|
            next if target.package_product_dependencies.any? { |dep| dep.product_name == product }
            dep = project.new(Xcodeproj::Project::Object::XCSwiftPackageProductDependency)
            dep.package = pkg
            dep.product_name = product
            target.package_product_dependencies << dep
            build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
            build_file.product_ref = dep
            target.frameworks_build_phase.files << build_file
          end
        end
        project.save
      end
    end
`;

module.exports = function withGoogleSignInSpmLink(config) {
  return withPodfile(config, (podfileConfig) => {
    const contents = podfileConfig.modResults.contents;
    if (contents.includes(MARKER)) return podfileConfig;
    const hook = contents.match(/^\s*post_install do \|installer\|\n/m);
    if (!hook || hook.index === undefined) {
      throw new Error('with-google-signin-spm-link: у Podfile немає post_install');
    }
    const at = hook.index + hook[0].length;
    podfileConfig.modResults.contents =
      contents.slice(0, at) + SNIPPET + contents.slice(at);
    return podfileConfig;
  });
};
