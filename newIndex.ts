type Handler<T> = {
  next?: (value: T) => void;
  error?: (error: any) => void;
  complete?: () => void;
};

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

  error(error: any): void {
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
        console.log('unsubscribed');
      };
    });
  }

  subscribe(handlers: Handler<T>): { unsubscribe: () => void } {
    const observer = new Observer<T>(handlers);
    const unsubscribeFn = this._subscribe(observer);

    if (unsubscribeFn) {
      observer._unsubscribe = unsubscribeFn;
    }

    return {
      unsubscribe: () => observer.unsubscribe()
    };
  }
}

// Constants
const HTTP_POST_METHOD = 'POST';
const HTTP_GET_METHOD = 'GET';

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

// Types
type HttpMethod = 'GET' | 'POST';

interface RequestMock {
  method: HttpMethod;
  host: string;
  path: string;
  body?: any;
  params: Record<string, any>;
}

interface ResponseMock {
  status: number;
}

// Data
const userMock = {
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

// Handlers
const handleRequest = (request: RequestMock): ResponseMock => {
  // handling of request
  console.log("Handling request:", request);
  return { status: HTTP_STATUS_OK };
};

const handleError = (error: any): ResponseMock => {
  // handling of error
  console.error("Error occurred:", error);
  return { status: HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete = (): void => console.log('complete');

// Execution
const requests$ = Observable.from<RequestMock>(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
