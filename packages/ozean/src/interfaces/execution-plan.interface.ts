import type { Middleware } from './middleware.interface';
import type { CanActivate } from './can-activate.interface';
import type { PipeTransform } from './pipe.interface';
import type { ExceptionFilter } from './exception-filter.interface';

export interface RouteExecutionPlan {
  controllerToken: Function;
  handlerName: string;
  middlewareInstances: Middleware[];
  guardInstances: CanActivate[];
  pipeInstances: PipeTransform[];
  filterInstances: ExceptionFilter[];
  paramMeta: any[];
  paramTypes: any[];
}
