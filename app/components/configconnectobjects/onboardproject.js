/* eslint-disable max-len */
export default
Vue.component('onboardproject',
    {
      data: function() {
        return {
          projectid: '',
          clusterselector: 'cnrm',
          repoName: '',
        };
      },
      props: ['nscontext'],
      methods: {
        onboardProject() {
          const vueObj = this;
          const formData = new FormData();
          vueObj.repoName = globalobj.selected;
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          axios.post('/onboardProject',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(response) {
            globalobj.appendLog(response.data);
            vueObj.projectid = '';
            vueObj.refreshAnthosTree();
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        refreshAnthosTree() {
          this.$parent.$refs.configconnecttree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Project ID"  v-model:value="projectid"> \
            </div> \ 
            <div class="row justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="onboardProject()" 
                :disabled="!projectid">Submit</button> \
            </div>  
        </div>`,
    },
);
