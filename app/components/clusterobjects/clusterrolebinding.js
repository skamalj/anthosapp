/* eslint-disable max-len */
// This component gets reponame from global object "globalobj" which is being created in
// main.handlebars in views directory
export default
Vue.component('clusterrolebinding',
    {
      data: function() {
        return {
          clusterrolebinding: '',
          clusterselector: '',
          clusterrole: '',
          subjectkind: '',
          subjectname: '',
          subjects: [],
          repoName: '',
        };
      },
      methods: {
        addNewSubject: function() {
          const newsubject = {};
          newsubject.KIND = this.subjectkind;
          newsubject.NAME = this.subjectname;
          newsubject.API_GROUP = this.subjectkind == 'ServiceAccount' ? '' : 'rbac.authorization.k8s.io';
          this.subjects.splice(0, 0, newsubject);
          this.subjectkind = '';
          this.subjectname = '';
        },
        createClusterRoleBinding() {
          const vueObj = this;
          // Set reponame from global vue object and send to bankend post request
          this.repoName = globalobj.selected;
          const formData = new FormData();
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          formData.set('subjects',JSON.stringify(vueObj.subjects));
          axios.post('/createClusterRoleBinding',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(resp) {
            globalobj.appendLog(resp.data);
            vueObj.refreshClusterTree();
            vueObj.clusterrolebinding = '';
            vueObj.clusterselector = '';
            vueObj.clusterrole = '';
            vueObj.subjects = [];
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        // This code uses ref object to find a parent and call refresh on that directory tree
        refreshClusterTree() {
          this.$parent.$refs.clusterdirtree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster Selector" v-model:value="clusterselector"> \
            </div> \        
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="ClusterRoleBinding Name"  v-model:value="clusterrolebinding"> \
            </div> \ 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="ClusterRole to bind"  v-model:value="clusterrole"> \
            </div> \ 
            <div  class="row  d-flex m-3 p-0"> \
                <div class="col-5">
                  <select  class="form-control" v-model="subjectkind"> \
                    <option value="" disabled selected>Select Subject Type</option>
                    <option>User</option>
                    <option>Group</option>
                    <option>ServiceAccount</option>
                  </select>
                </div>
                <div class="col-5">
                  <input  class="form-control" type="text" placeholder="Subject name"  v-model="subjectname"> \
                </div>
                <div class="col-1 m-0 p-0" v-if="subjectkind && subjectname" 
                  v-on:click="addNewSubject">  
                  <button type="button m-0 p-0" class="btn btn-light" >
                    <i class="fa fa-plus" aria-hidden="true"></i>
                  </button>
                </div> 
            </div>    
            <template v-for="(subject, index) in subjects">
              <div  class="row  d-flex m-3 p-0"> \
                <div class="col-5">
                  <input  class="form-control" type="text" readonly v-model:value="subject.KIND"> \
                </div>
                <div class="col-5">
                  <input  class="form-control" type="text" readonly v-model:value="subject.NAME"> \
                </div> 
                <div class="col-1 m-0 p-0">  
                  <button type="button m-0 p-0" class="btn btn-light" v-on:click="subjects.splice(index,1)">
                    <i class="fa fa-minus" aria-hidden="true"></i>
                  </button>
                </div>           
              </div> \
            </template>  
            <div class="row m-1 justify-content-end"> \
                <button type="button" :disabled="!clusterrolebinding || !clusterrole || (subjects.length == 0)" class="btn btn-dark" v-on:click="createClusterRoleBinding()">Submit</button> \
            </div>  
        </div>`,
    },
);
