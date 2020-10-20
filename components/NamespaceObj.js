/* eslint-disable max-len */
import namespaces from './namespaces.js';

export default
Vue.component('NamespaceObj',
    {
      data: function() {
        return {
          repoName: '',
          typeList: ['namespace', 'ClusterSelector', 'ClusterRole'],
          selectedType: 'namespace',
          nsselectedcontext: '',
        };
      },
      components: {
        namespaces,
      },
      watch: {
        selectedType: function(val) {
          this.$router.push({name: `/NamespaceObj/${val}`, params: {nscontext: nsselectedcontext}});
        },
      },
      methods: {
        setnscontext: function(fpath) {
          this.nsselectedcontext = fpath;
        },
      },
      created() {
        this.$router.push(`/NamespaceObj/${this.selectedType}`);
      },
      template: ` \
      <div class="container justify-content-end p-0 m-0">
        <div class="row">
          <div class="col-5 m-0 p-0">
            <namespaces hidenamespace=false ref="namespacetree" @nscontext="setnscontext"></namespaces>
          </div>
          <div class="col-7 m-0 p-0  justify-content-end">
            <label class="text-dark" for="namespaceObjId">Select Namespace Object</label>
            <select v-model="selectedType" class="form-control-sm m-1 p-1" id="namespaceObjId">
              <option v-for="type in typeList" :value="type">{{ type }}</option>
            </select>
            <router-view :nscontext="nsselectedcontext"></router-view>
          </div>          
        </div>
      </div>`,
    },
);
