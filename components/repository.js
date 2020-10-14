/* eslint-disable max-len */
export default
Vue.component('repository',
    {
      data: function() {
        return {
          repoName: '',
          repo: '',
          repoCredential: '',
          filename: 'Upload private key for Git-Repo',
          doNotInitializeRepo: '',
        };
      },
      methods: {
        handleFileUpload() {
          this.repoCredential = this.$refs.gitcred.files[0];
          this.filename = this.repoCredential.name;
        },
        saveRepo() {
          const formData = new FormData();
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          axios.post('/saveGitRepo',
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
                <label for="repository" class="col-sm-3 m-0 p-0 col-form-label">Repository URI</label> \
                <input id="repository" class="col-sm-9 form-control" type="text" placeholder="git@github.com:my-github-username/csp-config-management.git" v-model:value="repo"> \
            </div> \
            <div  class="row pb-3 m-0"> \   
                <div class="custom-file">
                    <label class="custom-file-label" v-model="filename" for="gitCredFile">{{ filename }}</label> \
                    <input type="file" name="gitcred" class="custom-file-input" ref="gitcred" id="gitCredFile" v-on:change="handleFileUpload()"> \
                </div> \
            </div> \
            <div class="row jpb-3 m-0 justify-content-end"> \
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="initializerepo" v-model:value="doNotInitializeRepo">
                    <label class="form-check-label" for="initializerepo">Do not initialize repo, it has Anthos configs</label>
                </div>
            </div>    
            <div class="row pb-3 m-0 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="saveRepo()">Save</button> \
            </div>    
        </div>`,
    },
);
