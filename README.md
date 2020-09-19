# MiniVue
A minimal implementation of Vue.

Introduction
------------

This is an experimental attempt to understand more what Vue has done for us.

(Note that it only implements a ***really small*** subset of Vue's functionality.)


Available directives
--------------------

* v-model (two-way-binding)
* v-text (one-way-binding)
* v-on (event handler)

(These directives only provide **shallow** bindings.)

Examples
--------

* `VueDemo.html` - A demonstrative page using Vue/MiniVue.

    If you comment out the `<script src="./mini-vue.js"></script>`
    
    and uncomment the `<script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>`, the code still works!
  
* `PlainDemo.html` - This is the same page without using Vue or MiniVue for comparison.
