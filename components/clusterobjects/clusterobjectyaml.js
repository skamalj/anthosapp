/* eslint-disable max-len */
export default
Vue.component('clusterobjectyaml',
    {
      data: function() {
        return {
          file: '',
          filename: 'Uplaod cluster object yaml',
          repoName: '',
        };
      },
      methods: {
        handleFileUpload() {
          this.file = this.$refs.objectyaml.files[0];
          this.filename = this.file ? this.file.name : 'Uplaod cluster object yaml';
        },
        submitFile() {
          this.repoName = globalobj.selected;
          const formData = new FormData();
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          axios.post('/uploadClusterObjectYaml',
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
            <input type="file" class="custom-file-input" id="clusterobjectyaml" ref="objectyaml" v-on:change="handleFileUpload()">
            <label class="custom-file-label" for="clusterobjectyaml">{{ filename }}</label>
          </div>
          <div class="row justify-content-end"> \
              <button type="button" :disabled="!file" class="btn btn-dark" v-on:click="submitFile()">Submit</button> \
          </div>   
        </div>`,
    },
);
