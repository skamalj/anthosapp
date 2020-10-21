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
          filecontent: '',
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
        showfilemodal: function(fpath) {
          const vueObj = this;
          return axios.post('/showFileContent', {filepath: fpath})
              .then(function(res) {
                globalobj.log = res.data;
                vueObj.filecontent = res.data;
                $('#filecontentmodal').modal('toggle');
              })
              .catch((err) => {
                window.alert(err);
              });
        },
      },
      created() {
        this.$router.push(`/NamespaceObj/${this.selectedType}`);
      },
      template: ` \
      <div class="container justify-content-end p-0 m-0">
      <div class="modal fade" id="filecontentmodal" tabindex="-1">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-body">
              <pre>{{ filecontent }}</pre>
            </div>
          </div>
        </div>
      </div>        
        <div class="row">
          <div class="col-6 m-0 p-0">
            <namespaces hidenamespace=false ref="namespacetree" @filecontentevent="showfilemodal" @nscontext="setnscontext"></namespaces>
          </div>
          <div class="col-6 m-0 p-0  justify-content-end">
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
