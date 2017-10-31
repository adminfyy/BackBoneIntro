define([
    "backbone",
    'text!templates/modal-version.html',
    'models/version',
    'common',
    'views/list',
    'text!templates/publish.html',
    'views/list-version-selected-item',
    'collections/req-on-version',
    'models/global',
    'jquery',
    'views/list-software',
    'collections/version'
], function (Backbone, versionDlg, versionModel, Common, stageView, PublishTemplate, CardView, Collection, Global, $, SoftwareListView, versionCollection) {

    function checkParentId(event,treeId,treeNode){
        $('#parentVersionList').hide();
        var treeObj = $.fn.zTree.getZTreeObj(treeId);
        if (treeNode.state != 0) {
            layer.msg("不能在已发布版本下创建子版本！");
            treeObj.checkNode(treeNode, false, true);
            $("#parentVersionName").val('');
            return;
        }
        var chooseStr = treeNode.name;
        $("#parentVersionName").val(chooseStr);
        return false;
    }

    return stageView.extend({
        
        collection: Collection,
        
        className: 'stage-list-item versionSelected',
        
        model: new Backbone.Model({
            id: 'versionSelected',
            name: "被选中的版本",
            sortableOpt: 'versionSelected',
            'customerCheckTime': '[未验收]',
            'planReleaseDate': '[未定义]',
            'realReleaseDate': '[未定义]',
            'onLinetime': '',
            'liftTestTime': '',
            'versionLiable': ''
        }),
        
        tools: [ {
            name: 'refresh',
            label: '刷新'
        }, {
            name: 'send',
            label: '发布'
        }, {
            name: "info-sign",
            label: "版本信息"
        }, {
            name: "sort",
            label: "排序"
        } ],
        
        popover: [ {
            name: 'deadline-sort',
            value: "按截止时间排序"
        }, {
            name: 'priority-sort',
            value: "按优先级排序"
        } ],
        
        refresh: function () {
            this.collection.refresh();
            return false;
        },
        initDataListening: function () {
            this.listenTo(this.collection, 'reset', _.debounce(this.addAll, 500));
            this.listenTo(this.collection, 'requesting', this.waitingForResp);
            this.listenTo(this.collection, 'all', this.updateCollectionCount);
            
            this.listenTo(this.model, 'change', _.debounce(this.updateName, 200));
            this.listenTo(this.model, 'destroy', this.remove);
            this.listenTo(Global, 'change:team', this.initTeamComponent);
            
            Backbone
                .off('select.version')
                .on('select.version', this.selectVersion, this);
        },
        
        initTeamComponent: function () {
            Backbone.ajax({
                method: 'get',
                url: rootPath + '/teammanager/getTeamInfo.shtml?teamId=' + Global.get("team"),
                dataType: "json"
            })
                .success(function (data) {
                    Global.set("component", data.component);
                })
                .fail(function () {
                    layer.msg("获取团队组件失败，请联系管理员");
                });
        },
        
        send: function () {
            var treeNode = JSON.parse(Global.get("currVer"));
            var that = this;
            if (treeNode.state != 0 || treeNode.id == -1) {
                layer.msg("该版本不能发布！");
                return false;
            }

            //发布时存在未完成需求时进行提示
           var publishFlag = true;
           var versionList = this.collection;
           versionList.each(function (e) {
               if (e.get('state') !== '完成') {
                   publishFlag = false;
               }
           });
           var upgradeContent="发布内容：\n";
           Backbone.ajax({
               method: 'get',
               url: rootPath + '/productReq/getVersionReqList.shtml?teamId=' + Global.get("team")+"&versionId="+treeNode.id,
               dataType: "json",
               async: false
           })
           .success(function (data) {
        	   data.parentReqList.map(function (el) {
            	   upgradeContent+=(el.issueKey||el.id)+":"+el.SUBJECT+"\n";
               });
           });
           if(publishFlag) {
               var model = new versionModel(treeNode);
               Backbone.trigger("setModal",
                   {
                       model: model,

                       template: _.template(PublishTemplate),

                       events: {
                           "click [role='send']": 'send',
                           "click [name='target']": 'showPrePub',
                           "change [name=verType]": 'versionTypeChange'
                       },

                       initPlugins: function () {
                           var id = this.model.get("id");
                           this.$("#sprintRange").val(this.model.get('planStartDate') + ' 至 ' + this.model.get('planReleaseDate'));

                           this.$testTime = flatpickr('#testTime', {
                               mode: "single",
                               locale: "zh",
                               allowInput: true,
                               closeOnSelect: true,
                               defaultDate: ''
                           });

                           this.productOpt = Global.get('productOpt');
                           if (this.productOpt) {
                               var $el = this.$('.prePubCom');
                               if (!$el.length) return;
                               $el.select2({data: this.productOpt, placeholder: "请选择"});
                               $el.val(Global.get("component")).trigger('change');
                           } else
                               this.getProducts();

                           this.pmsUsers = Global.get('pmsUsers');
                           if (this.pmsUsers) {
                               var $el = this.$('.pmsUsers');
                               if (!$el.length) return;
                               $el.select2({data: this.pmsUsers, placeholder: "请选择"});
                           } else
                               this.getPMSUsers();

                           $el = this.$("#reqlistspan");
                           if ($el.length) {
                               var data = Collection.toJSON().filter(function (product) {
                                   return product.pmsId && !!product.issueKey && (product.issueType == 1 || product.issueType == 2 || product.issueType == 3);
                               }).map(function (product) {
                                   product.text = product.issueKey + ":" + product.subject;
                                   product.id = product.issueKey;
                                   return product;
                               });
                               $el.select2($.extend({}, Common.REL_OPT, {data: data}));
                               val = data.map(function (el) {
                                   return el.id;
                               });
                               $el.val(val).trigger('change');
                           }

                           $el = this.$("#buglistspan");
                           if ($el.length) {
                               var data = Collection.toJSON().filter(function (product) {
                                   return product.pmsId && !!product.issueKey && (product.issueType == 4 || product.issueType == 5 || product.issueType == 6);
                               }).map(function (product) {
                                   product.text = product.issueKey + ":" + product.subject;
                                   product.id = product.issueKey;
                                   return product;
                               });
                               $el.select2($.extend({}, Common.REL_OPT, {data: data}));
                               val = data.map(function (el) {
                                   return el.id;
                               });
                               $el.val(val).trigger('change');
                           }
                           $el = this.$("#upgradeContent");
                           if ($el.length) {
                               $el.val(upgradeContent).trigger('change');
                           }
                           //文件上传
                           this.$(".fileUpload").fileupload({
                               dataType: 'json',
                               url: rootPath + "/uploadFile/fileUpload.shtml",
                               done: _.bind(this.afterFileUpload, this),
                               fail: function () {
                                   layer.msg("上传失败");
                               }
                           });

                           this.softwareList = new Backbone.Collection();
                           new SoftwareListView({collection: this.softwareList});
                           this.softwareList.add({
                               name: null
                           });

                           new Simditor({
                               textarea: '#reason2'
                           });

                       },
                       afterFileUpload: function (e, data) {
                           //console.log(data.result);
                           if ("attachfiles" == e.target.id) {
                               var fileId = data.result.fileName.substring(0, 13);
                               var span = $("<li id=" + fileId + " title=" + data.result.fileFullURL + ">" + data.result.oriFileName
                                   + "<span class='delete pull-right glyphicon glyphicon-trash custom-blue' title='删除附件'></span></li>");
                               span.on("click", _.bind(this.deleteAttachFile.bind(this, e.target.id, fileId)));
                               this.$("#attachList").append(span);
                           }
                           else {
                               this.$("#" + e.target.id).attr('type', 'text');
                               this.$("#" + e.target.id).attr('readonly', 'readonly');
                               this.$("#" + e.target.id).val(data.result.fileFullURL);
                               this.$("#" + e.target.id).hide();
                               this.$("#" + e.target.id + "_file").html(data.result.oriFileName);
                               this.$("#" + e.target.id + "_delete").addClass("delete pull-right glyphicon glyphicon-trash custom-blue");
                               this.$("#" + e.target.id + "_delete").on("click", _.bind(this.deleteFile.bind(this, e.target.id)));
                           }
                       },
                       deleteAttachFile: function (targetId, fileName) {
                           this.$("#attachList").find("li#" + fileName).remove();
                       },
                       deleteFile: function (targetId) {
                           this.$("#" + targetId + "_delete").removeClass("delete pull-right glyphicon glyphicon-trash custom-blue");
                           this.$("#" + targetId + "_file").html("");
                           this.$("#" + targetId).val("");
                           this.$("#" + targetId).attr('readonly', '');
                           this.$("#" + targetId).attr('type', 'file');
                           this.$("#" + targetId).show();
                       },
                       showPrePub: function (event) {
                           if (event.target.value == "1") {
                               $("#prePub").removeClass("hide");
                               $("#pub2PMS").addClass("hide");
                           } else if (event.target.value == "2") {
                               $("#prePub").addClass("hide");
                               $("#pub2PMS").removeClass("hide");
                           } else {
                               $("#prePub").addClass("hide");
                               $("#pub2PMS").addClass("hide");
                           }
                       },

                       versionTypeChange: function (e) {
                           var $el = $(e.target);
                           var val = $el.val();
                           //紧急发布显示 紧急发布理由
                           this.$('#reason1Div,#reason2Div')[ val == 2 ? 'show' : 'hide' ]();
                       },

                       getProducts: function () {
                           var that = this;
                           Backbone
                               .ajax({
                                   method: 'get',
                                   url: rootPath + '/verPublish/getPMSProducts.shtml?teamId=' + Global.get("team"),
                                   dataType: "json"
                               })
                               .success(function (data) {
                                   var arr = eval("(" + data + ")");
                                   var i = 0;
                                   var dataOpt = [];
                                   $.each(arr.products, function (index, value, array) {
                                       var item = {
                                           id: index,
                                           text: value
                                       };
                                       dataOpt[ i ] = item;
                                       i++;
                                   });
                                   Global.set('productOpt', dataOpt);
                                   Global.set('component', arr.component);
                                   var $el = that.$('.prePubCom');
                                   if (!$el.length) return;
                                   $el.select2({data: dataOpt, placeholder: "请选择"});
                                   $el.val(arr.component).trigger('change');
                               })
                               .fail(function () {
                                   layer.msg("获取PMS信息失败，请联系管理员！");
                               });
                       },
                       getPMSUsers: function () {
                           var that = this;
                           Backbone
                               .ajax({
                                   method: 'get',
                                   url: rootPath + '/verPublish/getPMSUsers.shtml',
                                   dataType: "json"
                               })
                               .success(function (data) {
                                   var arr = eval("(" + data + ")");
                                   var i = 0;
                                   var dataOpt = arr.users.map(function (item) {
                                       return {
                                           id: item.id,
                                           text: item.realname + "(" + item.email + ")"
                                       };
                                   });
                                   Global.set('pmsUsers', dataOpt);
                                   var $el = that.$('.pmsUsers');
                                   if (!$el.length) return;
                                   $el.select2({data: dataOpt, placeholder: "请选择"});
                               })
                               .fail(function () {
                                   layer.msg("获取PMS信息失败，请联系管理员！");
                               });
                       },
                       getFileName: function (path) {
                           var pos1 = path.lastIndexOf('/');
                           var pos2 = path.lastIndexOf('\\');
                           var pos = Math.max(pos1, pos2);
                           if (pos < 0)
                               return path;
                           else
                               return path.substring(pos + 1);
                       },
                       validatePubForm: function (data) {
                           if (data.product.length == 0) return false;
                           if (data.handler.length == 0) return false;
                           if (data.upgradeContent.length == 0) return false;
                           if (data.upgradeStep.length == 0) return false;
                           if (data.effect.length == 0) return false;
                           if (data.hazard.length == 0) return false;
                           //if (data.depend.length == 0) return false;

                           if (data.isPatchVersion.length == 0) return false;
                           if (data.backPlan.length == 0) return false;
                           if (data.verType == 2) {
                               if (data.reason1.length === 0) return false;
                               if (data.reason1 == 3) return data.reason2 || data.reason2.length;
                           }

                           return true;
                       },
                       validateSoftWare: function () {
                           var isSoftwareListValid = true;
                           this.softwareList.forEach(function (t) {
                               if (!t.get('name')) isSoftwareListValid = false;
                               if (!t.get('ip')) isSoftwareListValid = false;
                               if (!t.get('path')) isSoftwareListValid = false;
                               if (!t.get('MD5')) isSoftwareListValid = false;
                           });
                           if (!isSoftwareListValid) {
                               layer.msg('请正确填写软件包信息');
                           }
                           return isSoftwareListValid;
                       },
                       send: function () {
                           var sendThat = this;
                           this.$('#reqlistspan').removeAttr("disabled");
                           this.$('#buglistspan').removeAttr("disabled");
                           var data = this.$('#pubType').serializeJson();
                           var dataDetail;
                           if (data.target == "1") {
                               dataDetail = this.$('#prePub').serializeJson();
                               dataDetail.product = this.$('#prePub #product').val();
                               dataDetail.reqlistspan = Object.prototype.toString.call(dataDetail.reqlistspan) === '[object Array]' ? dataDetail.reqlistspan.join(',') : dataDetail.reqlistspan;
                               dataDetail.buglistspan = Object.prototype.toString.call(dataDetail.buglistspan) === '[object Array]' ? dataDetail.buglistspan.join(',') : dataDetail.buglistspan;
                               dataDetail.reqlistspan = dataDetail.reqlistspan ? dataDetail.reqlistspan : '';
                               dataDetail.buglistspan = dataDetail.buglistspan ? dataDetail.buglistspan : '';
                               data = $.extend(data, dataDetail);
                               data.teamId = Global.get("team");
                               var dateRange = this.$("#sprintRange").val().split(' ');
                               data.planStartDate = dateRange[ 0 ];
                               data.planReleaseDate = dateRange[ 2 ];
                           } else if (data.target == "2") {
                               dataDetail = this.$('#pub2PMS').serializeJson();
                               dataDetail.testTime = this.$testTime.selectedDates;
                               if (dataDetail.testTime.length == 0) {
                                   dataDetail.testTime = '';
                               } else {
                                   dataDetail.testTime = dataDetail.testTime[ 0 ].format("yyyy-MM-dd");
                               }

                               if (!this.validatePubForm(dataDetail)) {
                                   layer.msg("请检查必填项是否都填写完整");
                                   return;
                               }
                               dataDetail.chkDocPath = $("#chkDocPath").val();
                               if (dataDetail.verType == 1 && dataDetail.releaseType == 1 && (dataDetail.chkDocPath.length == 0)) {
                                   layer.msg("正常发布类型，【安全测试报告】必须上传！");
                                   return;
                               }
                               dataDetail.testDocPath = $("#testDocPath").val();
                               dataDetail.techWhitePage = $("#techWhitePage").val();
                               dataDetail.userManual = $("#userManual").val();

                               var attachList = "";
                               $('#attachList').find('li').each(function () {
                                   if (attachList.length > 0) attachList += ",";

                                   attachList += $(this).attr('title');
                               });
                               dataDetail[ "files[]" ] = attachList;
                               data = $.extend(data, dataDetail);
                               //需求清单列表
                               var demands = Collection.toJSON().filter(function (product) {
                                   return !product.parentId && !!product.issueKey;
                               }).map(function (product) {
                                   return product.issueKey;
                               });
                               data[ "_demands" ] = demands.join(",");
                               if (!this.validateSoftWare()) return false;
                               data.softwareList = this.softwareList.toJSON();
                               data.teamId = Global.get("team");
                           }

//                      return;
                           Backbone.ajax({
                               method: 'post',
                               url: rootPath + '/verPublish/verPublish.shtml',
                               dataType: "json",
                               data: JSON.stringify(data),
                               contentType: "application/json"
                           })
                               .success(function (data) {
                                   if (data[ Common.SUCCESS ]) {
                                       sendThat.$el.modal('hide');
                                       // 发布版本时，同步更新对应版本树
                                       Backbone.trigger("initZtreeVersion");
                                   }
                                   else {
                                       layer.msg(data.msg);
                                   }

                               })

                               .fail(function () {
                                   layer.msg("发布失败！请联系管理员");
                               });
                       }
                   });
           } else {
               layer.confirm('发布版本中存在未完成需求，仍然发布吗？', {
                   btn: [ '是', '否' ]
               }, function (index) {
                   layer.close(index);
                   var model = new versionModel(treeNode);
                   Backbone.trigger("setModal",
                       {
                           model: model,

                           template: _.template(PublishTemplate),

                           events: {
                               "click [role='send']": 'send',
                               "click [name='target']": 'showPrePub',
                               "change [name=verType]": 'versionTypeChange'
                           },

                           initPlugins: function () {
                               var id = this.model.get("id");
                               this.$("#sprintRange").val(this.model.get('planStartDate') + ' 至 ' + this.model.get('planReleaseDate'));

                               this.$testTime = flatpickr('#testTime', {
                                   mode: "single",
                                   locale: "zh",
                                   allowInput: true,
                                   closeOnSelect: true,
                                   defaultDate: ''
                               });

                               this.productOpt = Global.get('productOpt');
                               if (this.productOpt) {
                                   var $el = this.$('.prePubCom');
                                   if (!$el.length) return;
                                   $el.select2({data: this.productOpt, placeholder: "请选择"});
                                   $el.val(Global.get("component")).trigger('change');
                               } else
                                   this.getProducts();

                               this.pmsUsers = Global.get('pmsUsers');
                               if (this.pmsUsers) {
                                   var $el = this.$('.pmsUsers');
                                   if (!$el.length) return;
                                   $el.select2({data: this.pmsUsers, placeholder: "请选择"});
                               } else
                                   this.getPMSUsers();

                               $el = this.$("#reqlistspan");
                               if ($el.length) {
                                   var data = Collection.toJSON().filter(function (product) {
                                       return product.pmsId && !!product.issueKey && (product.issueType == 1 || product.issueType == 2 || product.issueType == 3);
                                   }).map(function (product) {
                                       product.text = product.issueKey + ":" + product.subject;
                                       product.id = product.issueKey;
                                       return product;
                                   });
                                   $el.select2($.extend({}, Common.REL_OPT, {data: data}));
                                   val = data.map(function (el) {
                                       return el.id;
                                   });
                                   $el.val(val).trigger('change');
                               }

                               $el = this.$("#buglistspan");
                               if ($el.length) {
                                   var data = Collection.toJSON().filter(function (product) {
                                       return product.pmsId && !!product.issueKey && (product.issueType == 4 || product.issueType == 5 || product.issueType == 6);
                                   }).map(function (product) {
                                       product.text = product.issueKey + ":" + product.subject;
                                       product.id = product.issueKey;
                                       return product;
                                   });
                                   $el.select2($.extend({}, Common.REL_OPT, {data: data}));
                                   val = data.map(function (el) {
                                       return el.id;
                                   });
                                   $el.val(val).trigger('change');
                               }
                               $el = this.$("#upgradeContent");
                               if ($el.length) {
                                   $el.val(upgradeContent).trigger('change');
                               }
                               //文件上传
                               this.$(".fileUpload").fileupload({
                                   dataType: 'json',
                                   url: rootPath + "/uploadFile/fileUpload.shtml",
                                   done: _.bind(this.afterFileUpload, this),
                                   fail: function () {
                                       layer.msg("上传失败");
                                   }
                               });

                               this.softwareList = new Backbone.Collection();
                               new SoftwareListView({collection: this.softwareList});
                               this.softwareList.add({
                                   name: null
                               });

                               new Simditor({
                                   textarea: '#reason2'
                               });

                           },
                           afterFileUpload: function (e, data) {
                               //console.log(data.result);
                               if ("attachfiles" == e.target.id) {
                                   var fileId = data.result.fileName.substring(0, 13);
                                   var span = $("<li id=" + fileId + " title=" + data.result.fileFullURL + ">" + data.result.oriFileName
                                       + "<span class='delete pull-right glyphicon glyphicon-trash custom-blue' title='删除附件'></span></li>");
                                   span.on("click", _.bind(this.deleteAttachFile.bind(this, e.target.id, fileId)));
                                   this.$("#attachList").append(span);
                               }
                               else {
                                   this.$("#" + e.target.id).attr('type', 'text');
                                   this.$("#" + e.target.id).attr('readonly', 'readonly');
                                   this.$("#" + e.target.id).val(data.result.fileFullURL);
                                   this.$("#" + e.target.id).hide();
                                   this.$("#" + e.target.id + "_file").html(data.result.oriFileName);
                                   this.$("#" + e.target.id + "_delete").addClass("delete pull-right glyphicon glyphicon-trash custom-blue");
                                   this.$("#" + e.target.id + "_delete").on("click", _.bind(this.deleteFile.bind(this, e.target.id)));
                               }
                           },
                           deleteAttachFile: function (targetId, fileName) {
                               this.$("#attachList").find("li#" + fileName).remove();
                           },
                           deleteFile: function (targetId) {
                               this.$("#" + targetId + "_delete").removeClass("delete pull-right glyphicon glyphicon-trash custom-blue");
                               this.$("#" + targetId + "_file").html("");
                               this.$("#" + targetId).val("");
                               this.$("#" + targetId).attr('readonly', '');
                               this.$("#" + targetId).attr('type', 'file');
                               this.$("#" + targetId).show();
                           },
                           showPrePub: function (event) {
                               if (event.target.value == "1") {
                                   $("#prePub").removeClass("hide");
                                   $("#pub2PMS").addClass("hide");
                               } else if (event.target.value == "2") {
                                   $("#prePub").addClass("hide");
                                   $("#pub2PMS").removeClass("hide");
                               } else {
                                   $("#prePub").addClass("hide");
                                   $("#pub2PMS").addClass("hide");
                               }
                           },

                           versionTypeChange: function (e) {
                               var $el = $(e.target);
                               var val = $el.val();
                               //紧急发布显示 紧急发布理由
                               this.$('#reason1Div,#reason2Div')[ val == 2 ? 'show' : 'hide' ]();
                           },

                           getProducts: function () {
                               var that = this;
                               Backbone
                                   .ajax({
                                       method: 'get',
                                       url: rootPath + '/verPublish/getPMSProducts.shtml?teamId=' + Global.get("team"),
                                       dataType: "json"
                                   })
                                   .success(function (data) {
                                       var arr = eval("(" + data + ")");
                                       var i = 0;
                                       var dataOpt = [];
                                       $.each(arr.products, function (index, value, array) {
                                           var item = {
                                               id: index,
                                               text: value
                                           };
                                           dataOpt[ i ] = item;
                                           i++;
                                       });
                                       Global.set('productOpt', dataOpt);
                                       Global.set('component', arr.component);
                                       var $el = that.$('.prePubCom');
                                       if (!$el.length) return;
                                       $el.select2({data: dataOpt, placeholder: "请选择"});
                                       $el.val(arr.component).trigger('change');
                                   })
                                   .fail(function () {
                                       layer.msg("获取PMS信息失败，请联系管理员！");
                                   });
                           },
                           getPMSUsers: function () {
                               var that = this;
                               Backbone
                                   .ajax({
                                       method: 'get',
                                       url: rootPath + '/verPublish/getPMSUsers.shtml',
                                       dataType: "json"
                                   })
                                   .success(function (data) {
                                       var arr = eval("(" + data + ")");
                                       var i = 0;
                                       var dataOpt = arr.users.map(function (item) {
                                           return {
                                               id: item.id,
                                               text: item.realname + "(" + item.email + ")"
                                           };
                                       });
                                       Global.set('pmsUsers', dataOpt);
                                       var $el = that.$('.pmsUsers');
                                       if (!$el.length) return;
                                       $el.select2({data: dataOpt, placeholder: "请选择"});
                                   })
                                   .fail(function () {
                                       layer.msg("获取PMS信息失败，请联系管理员！");
                                   });
                           },
                           getFileName: function (path) {
                               var pos1 = path.lastIndexOf('/');
                               var pos2 = path.lastIndexOf('\\');
                               var pos = Math.max(pos1, pos2);
                               if (pos < 0)
                                   return path;
                               else
                                   return path.substring(pos + 1);
                           },
                           validatePubForm: function (data) {
                               if (data.product.length == 0) return false;
                               if (data.handler.length == 0) return false;
                               if (data.upgradeContent.length == 0) return false;
                               if (data.upgradeStep.length == 0) return false;
                               if (data.effect.length == 0) return false;
                               if (data.hazard.length == 0) return false;
                               //if (data.depend.length == 0) return false;

                               if (data.isPatchVersion.length == 0) return false;
                               if (data.backPlan.length == 0) return false;
                               if (data.verType == 2) {
                                   if (data.reason1.length === 0) return false;
                                   if (data.reason1 == 3) return data.reason2 || data.reason2.length;
                               }

                               return true;
                           },
                           validateSoftWare: function () {
                               var isSoftwareListValid = true;
                               this.softwareList.forEach(function (t) {
                                   if (!t.get('name')) isSoftwareListValid = false;
                                   if (!t.get('ip')) isSoftwareListValid = false;
                                   if (!t.get('path')) isSoftwareListValid = false;
                                   if (!t.get('MD5')) isSoftwareListValid = false;
                               });
                               if (!isSoftwareListValid) {
                                   layer.msg('请正确填写软件包信息');
                               }
                               return isSoftwareListValid;
                           },
                           send: function () {
                               var sendThat = this;
                               this.$('#reqlistspan').removeAttr("disabled");
                               this.$('#buglistspan').removeAttr("disabled");
                               var data = this.$('#pubType').serializeJson();
                               var dataDetail;
                               if (data.target == "1") {
                                   dataDetail = this.$('#prePub').serializeJson();
                                   dataDetail.product = this.$('#prePub #product').val();
                                   dataDetail.reqlistspan = Object.prototype.toString.call(dataDetail.reqlistspan) === '[object Array]' ? dataDetail.reqlistspan.join(',') : dataDetail.reqlistspan;
                                   dataDetail.buglistspan = Object.prototype.toString.call(dataDetail.buglistspan) === '[object Array]' ? dataDetail.buglistspan.join(',') : dataDetail.buglistspan;
                                   dataDetail.reqlistspan = dataDetail.reqlistspan ? dataDetail.reqlistspan : '';
                                   dataDetail.buglistspan = dataDetail.buglistspan ? dataDetail.buglistspan : '';
                                   data = $.extend(data, dataDetail);
                                   data.teamId = Global.get("team");
                                   var dateRange = this.$("#sprintRange").val().split(' ');
                                   data.planStartDate = dateRange[ 0 ];
                                   data.planReleaseDate = dateRange[ 2 ];
                               } else if (data.target == "2") {
                                   dataDetail = this.$('#pub2PMS').serializeJson();
                                   dataDetail.testTime = this.$testTime.selectedDates;
                                   if (dataDetail.testTime.length == 0) {
                                       dataDetail.testTime = '';
                                   } else {
                                       dataDetail.testTime = dataDetail.testTime[ 0 ].format("yyyy-MM-dd");
                                   }

                                   if (!this.validatePubForm(dataDetail)) {
                                       layer.msg("请检查必填项是否都填写完整");
                                       return;
                                   }
                                   dataDetail.chkDocPath = $("#chkDocPath").val();
                                   if (dataDetail.verType == 1 && dataDetail.releaseType == 1 && (dataDetail.chkDocPath.length == 0)) {
                                       layer.msg("正常发布类型，【安全测试报告】必须上传！");
                                       return;
                                   }
                                   dataDetail.testDocPath = $("#testDocPath").val();
                                   dataDetail.techWhitePage = $("#techWhitePage").val();
                                   dataDetail.userManual = $("#userManual").val();

                                   var attachList = "";
                                   $('#attachList').find('li').each(function () {
                                       if (attachList.length > 0) attachList += ",";

                                       attachList += $(this).attr('title');
                                   });
                                   dataDetail[ "files[]" ] = attachList;
                                   data = $.extend(data, dataDetail);
                                   //需求清单列表
                                   var demands = Collection.toJSON().filter(function (product) {
                                       return !product.parentId && !!product.issueKey;
                                   }).map(function (product) {
                                       return product.issueKey;
                                   });
                                   data[ "_demands" ] = demands.join(",");
                                   if (!this.validateSoftWare()) return false;
                                   data.softwareList = this.softwareList.toJSON();
                                   data.teamId = Global.get("team");
                               }

//                      return;
                               Backbone.ajax({
                                   method: 'post',
                                   url: rootPath + '/verPublish/verPublish.shtml',
                                   dataType: "json",
                                   data: JSON.stringify(data),
                                   contentType: "application/json"
                               })
                                   .success(function (data) {
                                       if (data[ Common.SUCCESS ]) {
                                           sendThat.$el.modal('hide');
                                           // 发布版本时，同步更新对应版本树
                                           Backbone.trigger("initZtreeVersion");
                                       }
                                       else {
                                           layer.msg(data.msg);
                                       }

                                   })

                                   .fail(function () {
                                       layer.msg("发布失败！请联系管理员");
                                   });
                           }
                       });
               });
               return false;
           }

        },
        
        infoSign: function () {
            var treeNode = JSON.parse(Global.get("currVer"));
            var that = this;
            if (treeNode.id < 0) {
                layer.msg("非有效版本，不能查看！");
                return false;
            }
            Backbone.ajax({
                method: 'get',
                url: rootPath + '/version/getVersionDetail.shtml?id=' + treeNode.id,
                dataType: "json",
                
            })
                .success(function (data) {
                    if (data[ Common.SUCCESS ]) {
                        var model = new versionModel(data.versionFormMap);
                        that.verPopModal(model, treeNode);
                    } else {
                        layer.msg("获取版本信息失败！失败原因:" + data.errorMsg);
                        
                    }
                })
                
                .fail(function () {
                    layer.msg("编辑失败");
                });
            
            return false;
        },
        
        verPopModal: function (model, treeNode) {
            Backbone.trigger("setModal", {
                model: model,
                template: _.template(versionDlg),
                events: {
                    "click [role='update-version']": "saveVersion",
                    "click #parentVersionName": "zTreeToggleVersion"
                },
                initZtreeParentVersion: function() {
                    var setting = {
                        data: {
                            key: {
                                name: "name",
                                checked: "isChecked"
                            },
                            simpleData: {
                                enable: true,
                                idKey: "id",
                                pIdKey: "parentId",
                                // rootPId: -1
                            }
                        },
                        view: {
                            showIcon: false,
                            showLine: true
                        },
                        check: {
                            chkStyle: "radio",
                            enable: true,
                            autoCheckTrigger: true,
                            radioType : "all"
                        },
                        callback: {
                            onCheck: checkParentId
                        },
                        async: {
                            enable: true,
                            ataType: "json",
                            type: "get",
                            url: 'version/getVersionList.shtml'
                        }
                    };
                    versionCollection.fetch()
                        .success(function (res) {
                            // 初始化ztree
                            var rootNode = [{id: -1, parentId: 0, name: "未发布", state: "0", open: true, isParent: true}];
                            var zNodes = _.union(null, rootNode);
                            zNodes = _.union(zNodes, res.waitReleaseVerList);
                            $.fn.zTree.init($('#parentVersionList'), setting, zNodes);
                            var treeObj = $.fn.zTree.getZTreeObj('parentVersionList');
                            var versionId = model.toJSON().id || [];
                            // 勾选父版本
                            var parentVersionId = model.toJSON().parentId || [];
                            var curNode = treeObj.getNodesByParam('id', versionId);
                            var parentNode = treeObj.getNodesByParam('id',parentVersionId);
                            treeObj.checkNode(parentNode[0], true, false);
                            $('#parentVersionName').val(parentNode[0].name);
                        })
                },
                initPlugins: function () {
                    this.initZtreeParentVersion();
                    flatpickr('#planStartDate', {
                        locale: "zh",
                        allowInput: true,
                        defaultDate: this.model.get("planStartDate") || ''
                    });
                    
                    flatpickr('#planReleaseDate', {
                        locale: "zh",
                        allowInput: true,
                        defaultDate: this.model.get("planReleaseDate") || ''
                    });
                    
                    flatpickr('#realReleaseDate', {
                        mode: "single",
                        locale: "zh",
                        allowInput: true,
                        closeOnSelect: true,
                        defaultDate: this.model.get("realReleaseDate") || ''
                    });
                    flatpickr('#planOnLineDate', {
                        mode: "single",
                        locale: "zh",
                        allowInput: true,
                        closeOnSelect: true,
                        defaultDate: this.model.get("onLineTime") || ''
                    });
                    flatpickr('#planLiftTestDate', {
                        mode: "single",
                        locale: "zh",
                        allowInput: true,
                        closeOnSelect: true,
                        defaultDate: this.model.get("liftTestTime") || ''
                    });
                    this.getPMSUsers(this.model.get("versionLiable"));
                },
                getPMSUsers: function (user) {
                    var that = this;
                    Backbone
                        .ajax({
                            method: 'get',
                            url: rootPath + '/verPublish/getPMSUsers.shtml',
                            dataType: "json"
                        })
                        .success(function (data) {
                            var arr = eval("(" + data + ")");
                            var i = 0;
                            var dataOpt = arr.users.map(function (item) {
                                return {
                                    id: item.id,
                                    text: item.realname + "(" + item.email + ")"
                                };
                            });
                            Global.set('versionLiable', dataOpt);
                            var $el = that.$('.versionLiable');
                            if (!$el.length) return;
                            $el.select2({data: dataOpt, placeholder: "请选择"}); 
                            if(user!=''){
                          	  $el.val(user).trigger("change");
                            }
                        })
                        .fail(function () {
                            layer.msg("获取PMS信息失败，请联系管理员！");
                        });
                },
                // 切换组件下拉列表的显示/隐藏
                zTreeToggleVersion: function () {
                    $('#parentVersionList').toggle();
                },
                saveVersion: function () {
                    var that = this;
                    var data = this.$('form').serializeJson();
                    var nodes = $.fn.zTree.getZTreeObj('parentVersionList').getCheckedNodes() || [];
                    var parentId = nodes[0].id;
                    data.teamId = Global.get("team");
                    data.parentId = parentId || -1;
                    if (!Common.validateVersionInfo(data)) return;
                    var saveURL = data.id == "" ? '/version/createVersion.shtml' : '/version/updateVersion.shtml';
                    $.ajax({
                        method: 'post',
                        data: JSON.stringify(data),
                        url: rootPath + saveURL,
                        dataType: "json",
                        contentType: "application/json"
                    })
                        .success(function (resp) {
                            if (resp[ Common.SUCCESS ]) {
                                that.$el.modal('hide');
                                // 修改版本时，同步更新对应版本的子版本节点
                                treeNode.parentId = resp.versionFormMap.parentId;
                                treeNode.name = resp.versionFormMap.name;
                                treeNode.state = resp.versionFormMap.state;
                                treeNode.description = resp.versionFormMap.description;
                                treeNode.planStartDate = resp.versionFormMap.planStartDate;
                                treeNode.planReleaseDate = resp.versionFormMap.planReleaseDate;

                                Backbone.trigger("initZtreeVersion");
                                Backbone.trigger("updateTreeNode", treeNode);
                                Backbone.trigger('select.version', treeNode);
                            } else {
                                layer.msg('版本创建失败，失败原因：' + resp.errorMsg);
                            }
                        })
                        
                        .fail(function () {
                            layer.msg("保存失败");
                        });
                    
                }
            });
        },
        //按照截止时间排序
        deadlineSort: function () {
            this.collection.deadlineSort();
        },
        
        //优先级排序
        prioritySort: function () {
            this.collection.prioritySort();
        },
        
        selectVersion: function (version) {
            if (version) {
                var id = version.id;
                var info = _.pick(version, [ "name", "customerCheckTime", "planReleaseDate", "realReleaseDate" ]);
                _.defaults(info, {
                    'customerCheckTime': '[未验收]',
                    'planReleaseDate': '[未定义]',
                    'realReleaseDate': '[未定义]'
                });
                
                if (typeof id === 'undefined') return;
                //this.$taskList.sortable(version.id > 0 && version.state == 0 ? 'enable' : 'disable');
                Global.set("currVer", JSON.stringify(version));
                this.model.set(info);
                this.collection.versionId = id;
                this.collection.refresh();
            } else {
                this.model.set('name', '未选中版本');
                this.collection.reset();
            }
            
        },
        
        addOne: function (task) {
            var cardView = new CardView({
                model: task,
                //复用自身的集合
                collectionConstructor: Collection.__proto__.constructor
            });
            this.$taskList.append(cardView.render().el);
            cardView.loadChild();
        },
        
        updateName: function () {
            this.$('.name')
                .text(this.model.get('name'))
                .attr('title', this.model.get('name'));
            $('[role=plan-publish]').text(this.model.get('planReleaseDate'));
            $('[role=real-publish]').text(this.model.get('realReleaseDate'));
            $('[role=client-validate]').text(this.model.get('customerCheckTime'));
        },
        
        afterReceive: function (events, ui) {
            Common.afterReceive.call(this, events, ui, CardView);
        },
        //接受
        receiveSortable: function (event, ui) {
            //禁用卡片不允许放置
            if (ui.item.hasClass('disabled')) {
                ui.sender.sortable('cancel');
                return;
            }
            
            var that = this;
            var treeNode = JSON.parse(Global.get("currVer"));
            if (treeNode.state != 0 || treeNode.id == -1) {
                if (treeNode.state == 1) {
                    layer.msg("已发布版本不可规划需求！");
                } else {
                    layer.msg("请选择版本！");
                }
                ui.sender.sortable('cancel');
                return;
            }
            
            Backbone.ajax({
                url: rootPath + "/productReq/dragReq2Version.shtml",
                data: {
                    teamId: Global.get('team'),
                    versionId: this.collection.versionId,
                    reqId: ui.item.attr("data-id"),
                    verRank: this.getNextRank(ui.item)
                },
                method: 'get',
                dataType: 'json',
                contentType: 'application/json'
            })
                .done(function (data) {
                    if (data[ Common.SUCCESS ]) {
                        that.afterReceive.call(that, event, ui);
                    }
                    else {
                        ui.sender.sortable('cancel');
                        layer.msg(data[ Common.MSG ]);
                    }
                })
                .error(function (data) {
                    layer.msg('接口出现错误');
                    ui.sender.sortable('cancel');
                });
        },
        
        removeSortable: function (event, ui) {
        
        },
        
        updateSortable: function (event, ui) {
            
            //只相应本列表内的排序事件
            var self = this;
            var parentNode = ui.item.closest('.ui-sortable');
            if (parentNode.attr('id') !== 'versionSelected') return;
            //只相应本列表内的排序事件
            if (ui.sender) return;
            
            //子卡片不允许拖动
            if (ui.item.attr('child-card')) {
                this.$taskList.sortable('cancel');
                return;
            }
            
            //移动穿插在二级卡片的一级卡片的位置
            if (ui.item.next().attr('child-card')) {
                ui.item.insertAfter(ui.item.nextUntil(":not('[child-card]')").last());
            }
            
            var currentModel = ui.item.data('model'),
                currentRank = currentModel.get('verRank');
            
            Backbone
                .ajax({
                    url: rootPath + '/productReq/dragVerParentProductOrder.shtml',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: {
                        productReqId: ui.item.attr('data-id'),
                        rankCurrent: currentRank,
                        rankTarget: this.getNextRank(ui.item),
                        versionId: this.collection.versionId
                    }
                    //    刷新列表的顺序
                    //    不触发动画
                })
                .done(function (data) {
                    if (!data[ Common.SUCCESS ]) {
                        layer.msg(data[ Common.MSG ]);
                        ui.item.closest('.ui-sortable').sortable('cancel');
                        return;
                    }
                    this.collection.refresh({silent: true});
                    ui.item.trigger('position-changed');
                }.bind(this))
                .fail(function () {
                    self.$taskList.sortable('cancel');
                });
        },
        
        getNextRank: function (target) {
            var next = target.nextAll().not("[child-card]").first(),
                nextModel, nextRank;
            
            if (next.length) {
                nextModel = next.data('model');
                nextRank = nextModel && nextModel.get('verRank') || target.index() + 1;
            } else {
                nextModel = target
                    .prevAll()
                    .not("[child-card]").last()
                    .data('model');
                
                if (nextModel) {
                    nextRank = nextModel.get('verRank') + 1;
                } else {
                    nextRank = target.index() + 1;
                }
            }
            
            return nextRank;
        }
        
    });
    
    
});