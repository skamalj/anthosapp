/* eslint-disable max-len */
// This component gets reponame from global object "globalobj" which is being created in
// main.handlebars in views directory
export default
Vue.component('rolebinding',
    {
      data: function() {
        return {
          rolebinding: '',
          clusterselector: '',
          namespaceselector: '',
          role: '',
          subjectkind: '',
          subjectname: '',
          subjects: [],
          repoName: '',
        };
      },
      props: ['nscontext'],
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
        createRoleBinding() {
          const vueObj = this;
          // Set reponame from global vue object and send to bankend post request
          this.repoName = globalobj.selected;
          const formData = new FormData();
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          formData.set('subjects',JSON.stringify(vueObj.subjects));
          formData.set('nscontext', vueObj.nscontext);
          axios.post('/createRoleBinding',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(resp) {
            globalobj.appendLog(resp.data);
            vueObj.refreshClusterTree();
            vueObj.rolebinding = '';
            vueObj.clusterselector = '';
            vueObj.namespaceselector = '';
            vueObj.role = '';
            vueObj.subjects = [];
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        // This code uses ref object to find a parent and call refresh on that directory tree
        refreshClusterTree() {
          this.$parent.$refs.namespacetree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <h5><span class="badge badge-default">Selector:</span></h5> 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster Selector"  v-model:value="clusterselector"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Namespace Selector"  v-model:value="namespaceselector"> \
            </div> \
            <h5><span class="badge badge-default">Role Binding Definition:</span></h5>        
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="RoleBinding Name"  v-model:value="rolebinding"> \
            </div> \ 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Role to bind"  v-model:value="role"> \
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
                <button type="button" :disabled="!rolebinding || !nscontext || !role || (subjects.length == 0)" class="btn btn-dark" v-on:click="createRoleBinding()">Submit</button> \
            </div>  
            <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5>
        </div>`,
    },
);
