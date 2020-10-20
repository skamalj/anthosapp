/* eslint-disable max-len */
export default
Vue.component('namespace',
    {
      data: function() {
        return {
          namespace: '',
        };
      },
      props: ['nscontext'],
      methods: {
        createNamespace() {
          const vueObj = this;
          this.repoName = globalobj.selected;
          const formData = new FormData();
          formData.append('nscontext', vueObj.nscontext);
          Object.keys(this.$data).forEach( (key) => formData.append(key, JSON.stringify(this.$data[key])));
          axios.post('/createNamespace',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function() {
            window.alert('SUCCESS!!');
            vueObj.refreshClusterTree();
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        refreshClusterTree() {
          this.$parent.$refs.namespacetree.refresh();
        },
      },
      template: ` \
        <div class="container-fluid m-3"> \
            <input  class="form-control" type="text" placeholder="Namespace Name" v-model:value="namespace"> \
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="createNamespace()" :disabled="!nscontext">Submit</button> \
            </div> 
            <h5><span class="badge badge-default">
              Context: {{ nscontext }} 
            </span></h5>
        </div>`,
    },
);
