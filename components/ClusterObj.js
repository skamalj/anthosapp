/* eslint-disable max-len */
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
        <label class="text-dark" for="clusterObjId">Select Cluster Object</label>
        <select v-model="selectedType" class="form-control-sm m-1 p-1" id="clusterObjId">
        <option v-for="type in typeList" :value="type">{{ type }}</option>
        </select> 
        <div class="col-9 m-0 p-0  justify-content-end">
          <router-view></router-view>
        </div>          
    </div>`,
    },
);
