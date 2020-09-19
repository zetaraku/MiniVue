class Vue {
  constructor(options) {
    if (typeof(options.data) !== 'function') {
      let data = options.data;
      options.data = () => data;
    }
    let vm = this.vm = new VueInstance(options);
    vm.mount(document.querySelector(options.el));
  }
}

class VueInstance {
  constructor({ data, computed = {}, methods = {} }) {
    this.proxy = this.getProxy();

    this.data = data();
    this.computed = VueInstance.bindFunctions(computed, this.proxy);
    this.methods = VueInstance.bindFunctions(methods, this.proxy);

    this.modelMapping = new Map();
    this.renderMapping = new Map();
    this.listeners = [];
    this.mounted = false;
  }

  // add listeners to elements with v-model, v-text, and v-action
  mount(mountedTarget) {
    if (!this.mounted) {
      this.defineVModels(mountedTarget);
      this.defineVTexts(mountedTarget);
      this.defineVOns(mountedTarget);
      this.renderAll();
      this.mounted = true;
    } else {
      throw new Error('This instance has already mounted.');
    }
  }

  // un-mount and remove all renderMapping and listeners
  unMount() {
    if (this.mounted) {
      this.renderMapping.clear();
      while (this.listeners.length > 0) {
        let { element, type, listener } = this.listeners.pop();
        element.removeEventListener(type, listener);
      }
      this.mounted = false;
    }
  }

  // define a unified way to access the data, computed, and methods
  getProxy() {
    let self = this;
    return new Proxy({}, {
      get(target, key) {
        if (key in self.data)
          return self.data[key];
        if (key in self.computed)
          return self.computed[key]();
        if (key in self.methods)
          return self.methods[key];
      },
      // watch for any changes in data
      set(target, key, value) {
        if (key in self.data) {
          self.data[key] = value;
          // do a re-render when any data is changed
          self.renderAll();
          return true;
        }
        return false;
      },
    });
  }

  // add listeners to elements marked by v-model
  defineVModels(mountedTarget) {
    mountedTarget.querySelectorAll('*').forEach((element) => {
      for (let attributeName of element.getAttributeNames()) {
        let match = /^v-model(\.\w+)?/.exec(attributeName);
        if (match !== null) {
          let key = element.getAttribute(attributeName);
          let modifier = match[1];

          // update the bound data of the element with v-model when the element is changed
          let listener = (event) => this.updateData(element);

          // add event listener and save the config for removing
          element.addEventListener('input', listener);
          this.listeners.push({ element, type: 'input', listener });

          // add this element to modelMapping and renderMapping
          this.modelMapping.set(element, { key, extract: VueInstance.getModelMapper(element, modifier) });
          this.renderMapping.set(element, { key, render: VueInstance.getRenderMapper(element) });
        }
      }
    })
  }

  // add elements marked by v-text to render list
  defineVTexts(mountedTarget) {
    mountedTarget.querySelectorAll('[v-text]').forEach((element) => {
      let key = element.getAttribute('v-text');

      // add this element to renderMapping
      this.renderMapping.set(element, { key, render: VueInstance.getRenderMapper(element) });
    });
  }

  // add listeners to elements marked by v-on
  defineVOns(mountedTarget) {
    mountedTarget.querySelectorAll('*').forEach((element) => {
      for (let attributeName of element.getAttributeNames()) {
        let match = /^v-on:(\w+)/.exec(attributeName);
        if (match !== null) {
          let key = element.getAttribute(attributeName);
          let type = match[1];

          // call the handler of the element with v-on when the element receives user action
          let listener = (event) => {
            this.proxy[key]();
          };

          // add event listener and save the config for removing
          element.addEventListener(type, listener);
          this.listeners.push({ element, type, listener });
        }
      }
    });
  }

  // update data from element with extraction function in this.modelMapping
  updateData(element) {
    let { key, extract } = this.modelMapping.get(element);
    this.proxy[key] = extract(element);
  };

  // render all elements in this.renderMapping from this.proxy[key]
  renderAll() {
    for (let [element, { key, render }] of this.renderMapping.entries()) {
      render(element, this.proxy[key]);
    };
  }

  // bind every function in object to the target object
  static bindFunctions(funcs, target) {
    return Object.fromEntries(
      Object.entries(funcs).map(([key, func]) => [key, func.bind(target)])
    );
  }

  // define element-to-data relationship for elements with v-model
  static getModelMapper(element, modifier) {
    if (element.nodeName == 'INPUT') {
      if (modifier === '.number') {
        return (element) => Number(element.value);
      } else {
        return (element) => element.value;
      }
    } else {
      return (element) => element.innerText;
    }
  }

  // define element-to-data relationship for elements with v-model or v-text
  static getRenderMapper(element) {
    if (element.nodeName == 'INPUT') {
      return (element, value) => {
        element.value = value;
      };
    } else {
      return (element, value) => {
        element.innerText = value;
      };
    }
  }
}
