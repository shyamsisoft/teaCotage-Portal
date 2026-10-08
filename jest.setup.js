if (typeof global.Request === 'undefined') {
  class MockRequest {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url || '';
      this.method = init.method || 'GET';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.body = init.body;
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
  }

  global.Request = MockRequest;
}

if (typeof global.Response === 'undefined') {
  class MockResponse {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = new Map(Object.entries(init.headers || {}));
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }

    static json(data, init = {}) {
      return new MockResponse(data, init);
    }
  }

  global.Response = MockResponse;
}
