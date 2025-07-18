type Handler<T> = {
  next?: (value: T) => void;
  error?: (error: Error) => void;
  complete?: () => void;
};
type HttpMethod = 'GET' | 'POST';
interface User {
  name: string;
  age: number;
  roles: string[];
  createdAt: Date;
  isDeleated: boolean;
}
interface RequestMock {
  method: HttpMethod;
  host: string;
  path: string;
  body?: User;
  params: Record<string, string | number>;
}
interface ResponseMock {
  status: number;
}
class Observer<T> {
  private handlers: Handler<T>;
  private isUnsubscribed: boolean;
  public _unsubscribe?: () => void;

  constructor(handlers: Handler<T>) {
    this.handlers = handlers;
    this.isUnsubscribed = false;
  }
  
  next(value: T): void {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }
  
  error(error: Error): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }
      this.unsubscribe();
    }
  }
  
  complete(): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }
      this.unsubscribe();
    }
  }
  
  unsubscribe(): void {
    this.isUnsubscribed = true;
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}


class Observable<T> {
  private _subscribe: (observer: Observer<T>) => (() => void) | void;

  constructor(subscribe: (observer: Observer<T>) => (() => void) | void) {
    this._subscribe = subscribe;
  }
  static from<T>(values: T[]): Observable<T> {
    return new Observable<T>((observer: Observer<T>) => {
      values.forEach((value) => observer.next(value));
      observer.complete();

      return () => {
        console.log('Unsubscribed from the "from" array observable.');
      };
    });
  }
  subscribe(handlers: Handler<T>): { unsubscribe: () => void } {
    const observer = new Observer<T>(handlers);
    const unsubscribeFn = this._subscribe(observer);
    if (typeof unsubscribeFn === 'function') {
        observer._unsubscribe = unsubscribeFn;
    }
    return {
      unsubscribe: () => observer.unsubscribe()
    };
  }
}
const HTTP_POST_METHOD: HttpMethod = 'POST';
const HTTP_GET_METHOD: HttpMethod = 'GET';
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const userMock: User = {
  name: 'User Name',
  age: 26,
  roles: ['user', 'admin'],
  createdAt: new Date(),
  isDeleated: false,
};

const requestsMock: RequestMock[] = [
  {
    method: HTTP_POST_METHOD,
    host: 'service.example',
    path: 'user',
    body: userMock,
    params: {},
  },
  {
    method: HTTP_GET_METHOD,
    host: 'service.example',
    path: 'user',
    params: {
      id: '3f5h67s4s',
    },
  }
];

const handleRequest = (request: RequestMock): ResponseMock => {
  console.log("Handling request:", request);
  return { status: HTTP_STATUS_OK };
};

const handleError = (error: Error): ResponseMock => {
  console.error("An error occurred:", error.message);
  return { status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete = (): void => console.log('Processing complete.');

const requests$ = Observable.from<RequestMock>(requestsMock);

console.log('Subscribing to requests stream...');

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

console.log('Unsubscribing immediately.');

subscription.unsubscribe();

console.log('\n--- Demonstrating error handling ---');

const erroringObservable = new Observable<RequestMock>(observer => {
    observer.next(requestsMock[0]);
    observer.error(new Error("Something went wrong during the stream!"));
    observer.next(requestsMock[1]); 
});

erroringObservable.subscribe({
    next: handleRequest,
    error: handleError,
    complete: handleComplete,
});
