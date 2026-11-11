// Release-збірка Android (R8 з Firebase і Google Play Services) не вміщається в
// типові для шаблону Expo 2 ГБ heap і 512 МБ metaspace Gradle-демона: демон
// зупиняється з «running out of JVM Metaspace». gradle.properties генерує
// prebuild, тож ліміти задаються тут.
const { withGradleProperties } = require('expo/config-plugins');

const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (propsConfig) => {
    const props = propsConfig.modResults;
    const existing = props.find(
      (item) => item.type === 'property' && item.key === 'org.gradle.jvmargs',
    );
    if (existing) {
      existing.value = JVM_ARGS;
    } else {
      props.push({ type: 'property', key: 'org.gradle.jvmargs', value: JVM_ARGS });
    }
    return propsConfig;
  });
};
