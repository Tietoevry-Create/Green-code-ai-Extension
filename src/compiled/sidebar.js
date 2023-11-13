var app=function(){"use strict";function t(){}function e(t){return t()}function n(){return Object.create(null)}function o(t){t.forEach(e)}function r(t){return"function"==typeof t}function c(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function s(t,e){t.appendChild(e)}function u(t){t.parentNode&&t.parentNode.removeChild(t)}function i(t){return document.createElement(t)}function a(){return t=" ",document.createTextNode(t);var t}function l(t,e,n,o){return t.addEventListener(e,n,o),()=>t.removeEventListener(e,n,o)}function f(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function d(t,e){t.value=null==e?"":e}let p;function h(t){p=t}function $(t){(function(){if(!p)throw new Error("Function called outside component initialization");return p})().$$.on_mount.push(t)}const g=[],m=[];let b=[];const y=[],v=Promise.resolve();let w=!1;function x(t){b.push(t)}const _=new Set;let E=0;function k(){if(0!==E)return;const t=p;do{try{for(;E<g.length;){const t=g[E];E++,h(t),q(t.$$)}}catch(t){throw g.length=0,E=0,t}for(h(null),g.length=0,E=0;m.length;)m.pop()();for(let t=0;t<b.length;t+=1){const e=b[t];_.has(e)||(_.add(e),e())}b.length=0}while(g.length);for(;y.length;)y.pop()();w=!1,_.clear(),h(t)}function q(t){if(null!==t.fragment){t.update(),o(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(x)}}const C=new Set;function L(t,e){const n=t.$$;null!==n.fragment&&(!function(t){const e=[],n=[];b.forEach((o=>-1===t.indexOf(o)?e.push(o):n.push(o))),n.forEach((t=>t())),b=e}(n.after_update),o(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function O(t,e){-1===t.$$.dirty[0]&&(g.push(t),w||(w=!0,v.then(k)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function A(c,s,i,a,l,f,d,$=[-1]){const g=p;h(c);const m=c.$$={fragment:null,ctx:[],props:f,update:t,not_equal:l,bound:n(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(s.context||(g?g.$$.context:[])),callbacks:n(),dirty:$,skip_bound:!1,root:s.target||g.$$.root};d&&d(m.root);let b=!1;if(m.ctx=i?i(c,s.props||{},((t,e,...n)=>{const o=n.length?n[0]:e;return m.ctx&&l(m.ctx[t],m.ctx[t]=o)&&(!m.skip_bound&&m.bound[t]&&m.bound[t](o),b&&O(c,t)),e})):[],m.update(),b=!0,o(m.before_update),m.fragment=!!a&&a(m.ctx),s.target){if(s.hydrate){const t=function(t){return Array.from(t.childNodes)}(s.target);m.fragment&&m.fragment.l(t),t.forEach(u)}else m.fragment&&m.fragment.c();s.intro&&((y=c.$$.fragment)&&y.i&&(C.delete(y),y.i(v))),function(t,n,c,s){const{fragment:u,after_update:i}=t.$$;u&&u.m(n,c),s||x((()=>{const n=t.$$.on_mount.map(e).filter(r);t.$$.on_destroy?t.$$.on_destroy.push(...n):o(n),t.$$.on_mount=[]})),i.forEach(x)}(c,s.target,s.anchor,s.customElement),k()}var y,v;h(g)}class F{$destroy(){L(this,1),this.$destroy=t}$on(e,n){if(!r(n))return t;const o=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return o.push(n),()=>{const t=o.indexOf(n);-1!==t&&o.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function N(e){let n,r,c,p,h,$,g,m,b,y;return{c(){n=i("div"),r=i("h1"),r.textContent="Green Coding",c=a(),p=i("label"),p.innerHTML="<b>Code Review</b>",h=a(),$=i("textarea"),g=a(),m=i("button"),m.textContent="Get Feedback",f(r,"class","svelte-1w6wqoc"),f(p,"for","text"),f(p,"class","svelte-1w6wqoc"),f($,"rows","15"),f($,"id","text"),$.readOnly=!0,f($,"placeholder",e[1]),f($,"class","svelte-1w6wqoc"),f(m,"class","svelte-1w6wqoc"),f(n,"class","container svelte-1w6wqoc")},m(t,o){!function(t,e,n){t.insertBefore(e,n||null)}(t,n,o),s(n,r),s(n,c),s(n,p),s(n,h),s(n,$),d($,e[0]),s(n,g),s(n,m),b||(y=[l($,"input",e[3]),l(m,"click",e[2])],b=!0)},p(t,[e]){2&e&&f($,"placeholder",t[1]),1&e&&d($,t[0])},i:t,o:t,d(t){t&&u(n),b=!1,o(y)}}}function T(t,e,n){let o="",r="Highlight a piece of code and press `Get Feedback`!";return $((()=>{window.addEventListener("message",(t=>{const e=t.data;if("onSelectedText"===e.type)n(0,o=e.value)}))})),[o,r,function(){tsvscode.postMessage({type:"onFetchText",value:""}),n(1,r="Loading...")},function(){o=this.value,n(0,o)}]}return new class extends F{constructor(t){super(),A(this,t,T,N,c,{})}}({target:document.body,props:{name:"world"}})}();
//# sourceMappingURL=bundle.js.map
