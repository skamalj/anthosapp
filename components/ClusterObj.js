/* eslint-disable max-len */
import dirtree from './dirtree.js';

export default
Vue.component('clusterObj',
    {
      data: function() {
        return {
          repoName: '',
          typeList: ['ClusterLabel', 'ClusterSelector', 'ClusterRole', 'ClusterObjectManifest'],
          selectedType: 'ClusterLabel',
          filecontent: '',
        };
      },
      components: {
        dirtree,
      },
      methods: {
        showfilemodal: function(fpath) {
          const vueObj = this;
          return axios.post('/showFileContent', {filepath: fpath})
              .then(function(resp) {
                vueObj.filecontent = resp.data;
                $('#filecontentmodal').modal('toggle');
              })
              .catch((err) => {
                window.alert(err);
              });
        },
      },
      watch: {
        selectedType: function(val) {
          this.$router.push(`/ClusterObj/${val}`);
        },
      },
      mounted() {
        this.$router.push(`/ClusterObj/${this.selectedType}`);
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
            <dirtree hidenamespace=true :repoName="globalobj.selected" @filecontentevent="showfilemodal" ref="clusterdirtree"></dirtree>
          </div>
          <div class="col-7 m-0 pr-3  justify-content-end">
            <label class="text-dark" for="clusterObjId">Select Cluster Object</label>
            <select v-model="selectedType" class="form-control-sm m-1 p-1" id="clusterObjId">
              <option v-for="type in typeList" :value="type">{{ type }}</option>
            </select>
            <router-view></router-view>
          </div>          
        </div>
      </div>`,
    },
);
