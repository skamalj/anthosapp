/* eslint-disable max-len */
export default
Vue.component('DeployOperator',
    {
      data: function() {
        return {
          clusterName: '',
          repoName: '',
        };
      },
      methods: {
        deployOperator() {
          const formData = new FormData();
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          axios.post('/deployOperator',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function() {
            window.alert('SUCCESS!!');
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
      },
      template: ` \
        <div class="container m-0 p-0"> \
            <div class="row pb-3 m-0"> \
                <label for="repoName" class="col-sm-3 m-0 p-0 col-form-label">Repository Name</label> \
                <input id="repoName" class="col-sm-9 form-control" type="text" placeholder="Name for your repository" v-model:value="repoName"> \
            </div> \
            <div class="row pb-3 m-0"> \    
                <label for="clusterName" class="col-sm-3 m-0 p-0 col-form-label">Cluster Name</label> \
                <input id="clusterName" class="col-sm-9 form-control" type="text" placeholder="Cluster Name" v-model:value="clusterName"> \
            </div> \   
            <div class="row pb-3 m-0 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="deployOperator()">Save</button> \
            </div>    
        </div>`,
    },
);
