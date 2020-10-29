/* eslint-disable max-len */
export default
Vue.component('NSObjectYaml',
    {
      data: function() {
        return {
          file: null,
          filename: 'Uplaod object yaml',
          repoName: '',
        };
      },
      props: ['nscontext'],
      methods: {
        handleFileUpload() {
          this.file = this.$refs.objectyaml.files[0];
          this.filename = this.file.name;
        },
        submitFile() {
          this.repoName = globalobj.selected;
          const formData = new FormData();
          formData.append('nscontext', JSON.stringify(vueObj.nscontext));
          Object.keys(this.$data).forEach( (key) => formData.append(key, JSON.stringify(this.$data[key])));
          axios.post('/uploadObjectYaml',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function() {
            globalobj.appendLog(resp.data);
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
      },
      template: ` \
        <div class="container"> \        
          <div class="row m-3 custom-file">
            <input type="file" class="custom-file-input" id="objectyaml" ref="objectyaml" v-on:change="handleFileUpload()">
            <label class="custom-file-label" for="objectyaml">{{ filename }}</label>
            <div class="container">
            </div>
          </div>
          <div class="row mb-5 justify-content-end"> \
              <button type="button" class="btn btn-dark" :disabled="!(file && nscontext)" v-on:click="submitFile()">Submit</button> \
          </div>   
          <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5>
        </div>`,
    },
);
