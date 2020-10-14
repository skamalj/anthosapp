/* eslint-disable max-len */
import namespaces from './namespaces.js';

export default
Vue.component('clusterObj',
    {
      data: function() {
        return {
          repoName: '',
          typeList: ['ClusterLabel', 'ClusterSelector', 'ClusterRole'],
          selectedType: 'ClusterLabel',
        };
      },
      components: {
        namespaces,
      },
      watch: {
        selectedType: function(val) {
          this.$router.push(`/ClusterObj/${val}`);
        },
      },
      created() {
        this.$router.push(`/ClusterObj/${this.selectedType}`);
      },
      template: ` \
      <div class="container justify-content-end p-0 m-0">
        <div class="row">
          <div class="col-5 m-0 p-0">
            <namespaces hidenamespace=true ref="clusterdirtree"></namespaces>
          </div>
          <div class="col-7 m-0 p-0  justify-content-end">
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
