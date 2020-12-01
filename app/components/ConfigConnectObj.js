/* eslint-disable max-len */
import dirtree from './dirtree.js';

export default
Vue.component('ConfigConnect',
    {
      data: function() {
        return {
          repoName: '',
          typeList: ['OnboardProject', 'Network', 'Cloud Storage'],
          selectedType: 'OnboardProject',
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
        this.$router.push(`/ConfigConnectObj/${this.selectedType}`);
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
          <div class="col-5 m-0 p-0">
            <dirtree hidenamespace=false :repoName="globalobj.selected" ref="configconnecttree" @filecontentevent="showfilemodal" @nscontext="setnscontext"></dirtree>
          </div>
          <div class="col-7 m-0 pr-3">
            <label class="text-dark" for="configConnectObjId">Select Connect Object</label>
            <select v-model="selectedType" class="form-control-sm" id="configConnectObjId">
              <option v-for="type in typeList" :value="type">{{ type }}</option>
            </select>
            <router-view :nscontext="nsselectedcontext" :repoName="globalobj.selected"></router-view>
          </div>          
        </div>
      </div>`,
    },
);
