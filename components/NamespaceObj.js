/* eslint-disable max-len */
import dirtree from './dirtree.js';

export default
Vue.component('NamespaceObj',
    {
      data: function() {
        return {
          repoName: '',
          typeList: ['Namespace', 'ObjectYaml'],
          selectedType: 'Namespace',
          nsselectedcontext: '',
          filecontent: '',
        };
      },
      components: {
        dirtree,
      },
      watch: {
        selectedType: function(val) {
          this.$router.push({name: `${val}`});
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
          <div class="col-4 m-0 p-0">
            <dirtree hidenamespace=false :repoName="globalobj.selected" ref="namespacetree" @filecontentevent="showfilemodal" @nscontext="setnscontext"></dirtree>
          </div>
          <div class="col-8 m-0 pr-3  justify-content-end">
            <label class="text-dark" for="namespaceObjId">Select Namespace Object</label>
            <select v-model="selectedType" class="form-control-sm m-1 p-1" id="namespaceObjId">
              <option v-for="type in typeList" :value="type">{{ type }}</option>
            </select>
            <router-view :nscontext="nsselectedcontext" :repoName="globalobj.selected"></router-view>
          </div>          
        </div>
      </div>`,
    },
);
