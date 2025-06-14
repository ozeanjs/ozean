import { getMetadataArgsStorage } from '../metadata/storage';

function pathToRegex(path: string) {
  const keys: string[] = [];
  const regex = new RegExp(
    '^' +
      path.replace(/\/$/, '').replace(/\/(\:([^\/]+))/g, (_, _s, key) => {
        keys.push(key);
        return '/([^/]+)';
      }) +
      '/?$'
  );
  return { regex, keys };
}

export interface MatchedRouteInfo {
  controllerClassToken: Function;
  handlerName: string;
  params: Record<string, string>;
  routePath: string;
}

export function matchRoute(method: string, pathname: string): MatchedRouteInfo | null {
  const { routes, controllers } = getMetadataArgsStorage();
  const normalizedRequestPath = pathname.replace(/\/$/, '') || '/';

  for (const route of routes) {
    const controllerMeta = controllers[route.target as any];
    const controllerBasePath = controllerMeta ? controllerMeta.path.replace(/\/$/, '') || '/' : '/';
    const routeSpecificPath = route.path.replace(/\/$/, '');
    let fullPath: string;

    if (controllerBasePath === '/') fullPath = routeSpecificPath || '/';
    else if (routeSpecificPath === '' || routeSpecificPath === '/') fullPath = controllerBasePath;
    else
      fullPath = `${controllerBasePath}${routeSpecificPath.startsWith('/') ? '' : '/'}${routeSpecificPath}`;

    if (fullPath === '') fullPath = '/';

    const { regex, keys } = pathToRegex(fullPath);
    const match = normalizedRequestPath.match(regex);

    if (match && method.toUpperCase() === route.method.toUpperCase()) {
      const params: Record<string, string> = {};
      keys.forEach((key, i) => (params[key] = decodeURIComponent(match[+i + 1]!)));
      return {
        controllerClassToken: route.target,
        handlerName: route.handlerName,
        params,
        routePath: fullPath,
      };
    }
  }

  return null;
}
