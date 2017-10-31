define([
    "backbone",
    "views/modal-split-logic",
    'text!templates/modal-split.html',
    'common',
    'views/list-ac',
    'views/list-attachment',
    'views/list-total-solution',
    'collections/tag',
    'collections/team-member',
    'models/global',
    'collections/product',
    'collections/all-component'
], function (Backbone, SplitLogic, template, Common, acView, attachmentView, totalSolutionView, TagCollection,
             TeamMemberCollection, Global, ProductCollection, allComponent) {
    return function (model) {
        var defaults = {
            template: _.template(template),
            initPlugins: function () {
                var self = this;
                this.$splitList = this.$('#childSplit');
                this.listenTo(this.collection, "view-item-detail", this.showItem.bind(this));
                this.listenTo(this.collection, "reset", this.addAll);
                this.listenTo(this.collection, "add", this.addOne);
                this.listenTo(this.collection, "destroy", this.showDefaultItem);

                flatpickr("[plugin='date-picker']", {
                    locale: 'zh'
                });

                var fields = [{
                    field: 'issueType',
                    options: {
                        data: Common.issueTypeOptions
                    }
                }, {
                    field: 'reqTagList',
                    options: $.extend({}, Common.TAG_SELECT2_OPT, {data: TagCollection.toJSON()})
                }, {
                    field: 'reqRelateList',
                    options: $.extend({}, Common.REL_OPT, {
                        data: function () {
                            return _(ProductCollection.toJSON()).reject(self.model.toJSON());
                        }()
                    })
                }, {
                    field: 'reqPartyList',
                    options: Common.USER_AJAX_OPT
                }, {
                    field: 'priority',
                    options: {
                        data: Common.priorityOptions
                    }
                }, {
                    field: 'assignerId',
                    options: {data: TeamMemberCollection.getSelect2Data(), placeholder: "未指派"}
                }];
                fields.forEach(function (i) {
                    self
                        .$('#' + i.field)
                        .select2(i.options);
                });

                //    acList data
                this.acList = new Backbone.Collection();
                new acView({collection: this.acList, el: this.$('.acList')});

                // attachment list
                this.attachmentList = new Backbone.Collection();
                new attachmentView({collection: this.attachmentList, el: this.$('.attachmentList')});

                // wikiLinkList list
                this.wikiLinkList = new Backbone.Collection();
                new totalSolutionView({collection: this.wikiLinkList, el: this.$('.totalSolution')});

                //initial editor
                this.$description = new Simditor(
                    _.extend({
                        textarea: this.$("#description")
                    }, Common.simditorDefaultConf)
                );

                this.collection.fetch({
                    reset: true,
                    wait: true,
                    data: {"parentId": this.model.get("id")},
                    url: this.url.children
                });
            },
            getPageJson: function () {
                var dataJson = this.$el.find("form").serializeJson();
                dataJson.assigner = this.$el.find('#assignerId option:selected').text();
                dataJson.issueType = $('#issueType').val();
                dataJson.reqTagList = this.reformatTagList(dataJson.reqTagList);
                dataJson.acList = this.acList.toJSON();

                dataJson.addAcList = dataJson.acList.filter(function (el) {
                    return !el.id;
                });
                dataJson.editAcList = dataJson.acList.filter(function (el) {
                    return el.id;
                });
                dataJson.delAcList = this.model.get('acList').filter(function (item) {
                    var exist = false;
                    dataJson.acList.filter(function (el) {
                        if (el.id === item.id) exist = true;
                    });
                    return !exist;
                });

                dataJson.attachmentList = this.attachmentList.toJSON();
                dataJson.addAttachmentList = dataJson.attachmentList.filter(function (el) {
                    return !el.id;
                });
                dataJson.editAttachmentList = dataJson.attachmentList.filter(function (el) {
                    return el.id;
                });
                dataJson.delAttachmentList = this.model.get('attachmentList').filter(function (item) {
                    var exist = false;
                    dataJson.attachmentList.filter(function (el) {
                        if (el.id === item.id) exist = true;
                    });
                    return !exist;
                });

                dataJson.reqRelateList = _.flatten([dataJson.reqRelateList])
                    .filter(function (el) {
                        return !!el;
                    })
                    .map(function (el) {
                        return {relateId: el};
                    });

                dataJson.reqPartyList = _.flatten([dataJson.reqPartyList])
                    .filter(function (el) {
                        return !!el;
                    })
                    .map(function (item) {
                        return {
                            userId: item,
                            smReqId: dataJson.id
                        };
                    });
                var comId = this.model.get("comId");
                data.groupName = allComponent.getGroupName(comId);
                data.cascadeComValue = allComponent.getCascadeValue(comId);

                return dataJson;
            },

            reformatTagList: function (tagList) {

                var newList = [];

                if (!tagList) {
                    return newList;
                }

                if (!_.isArray(tagList)) {
                    tagList = [tagList];
                }


                var model, key;
                for (var i in tagList) {
                    if (!tagList.hasOwnProperty(i)) continue;
                    key = tagList[i];

                    model = TagCollection.get(key);

                    if (!model) model = {name: key};

                    model.toJSON && (model = model.toJSON());

                    model.id && (model["smTagId"] = model.id);

                    model["smReqId"] = this.model.get('id');

                    newList.push(model);
                }


                return newList;
            },

            renderData: function (model) {
                var self = this;
                var getData = function (key) {
                    var data;
                    if (key === 'reqTagList') {
                        data = model.get(key);
                        data = data.map(function (i) {
                            return i.smTagId;
                        });
                        return data;
                    }

                    if (key === 'reqRelateList') {
                        data = model.get(key);
                        data = data.map(function (el) {
                            return el.relateId;
                        });
                        return data;
                    }

                    if (key === 'reqPartyList') {
                        data = model.get(key);
                        data = data.map(function (el) {
                            return el.userId;
                        });
                        return data;
                    }
                    if (key === 'parentId') {
                        return self.model.id;
                    }
                    return model.get(key);
                };
                [
                    "subject",
                    "assigner",
                    "planPublishDate",
                    "priority",
                    "storyNum",
                    "issueType",
                    "submitter",
                    "reqTagList",
                    "reqRelateList",
                    "reqPartyList",
                    "parentId",
                    "issueKey",
                    "teamId"
                ].forEach(function (key) {
                    self.$('#' + key)
                        .val(getData(key))
                        .trigger('change');
                });
                this.acList.reset(getData('acList'));
                this.attachmentList.reset(getData('attachmentList'));
                this.$description.setValue(getData('description'));
            },

            save: function () {
                //  自动保存出现校验错误
                if (!this.autoSave()) {
                    return false;
                }
                var that = this;
                var data = this.collection.filter(function (model) {
                    return model.isNew();
                });

                data = data.map(function (model) {
                    model.set('teamId', Global.get('team'));
                    model.set('isReady', 1);//产品列表拆分需求的时候，子需求的isReady还是就绪
                    return model.toJSON();
                });
                $.ajax({
                    url: this.url.save,
                    type: "post",
                    dataType: "json",
                    contentType: "application/json",
                    data: JSON.stringify(data)
                })
                    .success(function (res) {
                        if (res.success) {
                            //layer.msg("创建成功");
                            //剔除 hide.bs.modal 监听事件
                            TagCollection.refresh();
                            that.$el.off('hide.bs.modal');
                            that.$el.modal("hide");
                            Backbone.trigger("PRODUCT-LIST-REFRESH");
                            Backbone.trigger("DEMAND-POOL-REFRESH");
                        } else {
                            layer.msg(res.msg);
                        }
                    }.bind(this));
            }
        };
        return $.extend(true, SplitLogic, defaults, {model: model});
    };
});