/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/analytics` | `/analytics`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/more` | `/more`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}${'/(objects)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}${'/(objects)'}/preview` | `/preview`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/analytics` | `/analytics`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/more` | `/more`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}${'/(objects)'}` | `/`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}${'/(objects)'}/preview` | `/preview`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/analytics${`?${string}` | `#${string}` | ''}` | `/analytics${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/more${`?${string}` | `#${string}` | ''}` | `/more${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}${'/(objects)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}${'/(objects)'}/preview${`?${string}` | `#${string}` | ''}` | `/preview${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString | Router.ExternalPathString | `/_sitemap` | `${'/(tabs)'}/analytics` | `/analytics` | `${'/(tabs)'}/more` | `/more` | `${'/(tabs)'}${'/(objects)'}` | `/` | `${'/(tabs)'}${'/(objects)'}/preview` | `/preview`; params?: Router.UnknownInputParams; };
    }
  }
}
