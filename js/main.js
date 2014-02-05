var GTD = GTD || {};

GTD.makeDraggable = function() {

    _.each($('.issue'), function(issue) {
        var isNew = $(issue).attr('id') == 'add-new-task';
        //console.log($(issue), 'made draggable');
        $(issue).draggable({
            stop: function( event, ui ) {
                _.each($('.progress-col'), function(column) {
                    var $column = $(column);
                    if (($column.offset().left <= ui.offset.left) && ($column.offset().left + $column.width() >= ui.offset.left) &&
                        ($column.offset().top <= ui.offset.top) && ($column.offset().top + $column.height() >= ui.offset.top)) {

                        if (isNew) {
                            // get new id
                            var dragElementId = 1 + _.max(GTD.tasks.data, function(task) {
                                    return task.id;
                                }).id,
                                newStatus = GTD.getStatus(column.id),
                                newType = $('#issue-type').val();

                            GTD.tasks.add({id: dragElementId, name: 'New Issue', type: newType, status: newStatus})
                        } else {
                            var dragElementId = $(event.target).children('.issue-id').text(),
                                newStatus = GTD.getStatus(column.id);

                            GTD.tasks.edit(dragElementId, {status: newStatus});
                            //GTD.tasks.draw();
                        }

                    }  else {
                        $(event.target).css({left: 0, top: 0});
                    }
                });
            }
        });
    });
};


GTD.getStatus = function(id) {
    var status = '';
    switch (id) {
        case 'not-started':
             status = GTD.taskStatus.NOT_STARTED;
            break;
        case 'in-progress':
            status = GTD.taskStatus.IN_PROGRESS;
            break;
        case 'finished':
            status = GTD.taskStatus.DONE;
            break;
    }
    return status;
};

GTD.localStorageDataName = 'issues-data';

GTD.tasks = {
    data: GTD.tasksList,
    selector: '',
    add: function(newTask) {
        var self = this;
        newTask.status = newTask.status || GTD.taskType.NOT_STARTED;
        self.data.push(newTask);
        self.draw();
        GTD.saveData();
    },
    edit: function(id, newData) {
        var self = this;
        _.each(self.data, function(task) {
            if (task.id == id) {
                if (newData.name) {
                    task.name = newData.name;
                }

                if (newData.type) {
                    task.type = newData.type;
                }
                if (newData.status) {
                    task.status = newData.status;
                }
            }
        });
        self.draw();
        GTD.saveData();

    },
    remove: function(id) {
        var self = this;
        _.each(self.data, function(task, index) {
            if (task.id == id) {
                self.data.splice(index, 1);
            }
        });
        self.draw();
        GTD.saveData();
    },
    draw: function() {
        var self = this,
            $parent = $(this.selector);

        $parent.html(
            $('#statusColumns').render(GTD.columnsData)
        );

        _.each(self.data, function(task) {
            var renderData = {};

            renderData.issueTypeClassName = (task.type == 1) ? 'task' : 'bug';
            renderData.task = task;


            var columnHtmlId = _.find(GTD.columnsData, function(column) {
                return column.id == task.status;
            }).htmlId;

            $('#' + columnHtmlId).append(
                $('#taskTmlp').render(renderData)
            );

        });

        GTD.makeDraggable();
    }
};


GTD.saveData = function() {
    var data = {
        tasks: this.tasks.data,
        columnsData: this.columnsData
    };
    localStorage.setItem(GTD.localStorageDataName, JSON.stringify(data));
};

GTD.loadData = function() {
    var data = localStorage.getItem(this.localStorageDataName),
        self = this;
    if (data) {
        data = JSON.parse(data);
        self.tasks.data = data.tasks;
        self.columnsData = data.columnsData;
        self.taskStatus = data.taskStatus;
        self.taskType = data.taskType;
        GTD.tasks.draw();
    } else {
        console.log('ajax');
        $.ajax(
            {
                url: "js/data.json",
                success: function(data) {
                    self.tasks.data = data.taskList;
                    self.columnsData = data.columns;
                    self.taskStatus = data.taskStatus;
                    self.taskType = data.taskType;
                    GTD.tasks.draw();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR, textStatus, errorThrown);
                }
            }
        );
    }

};

$(document).ready(function() {



    // remove issue
    $('#issues-panel').on('click', '.close', function() {
        var issueId = parseInt($(this).siblings('.issue-id').text());
        GTD.tasks.remove(issueId);
    });


    // start edit issue
    $('#issues-panel').on('dblclick', '.issue', function() {
        $(this).toggleClass('edit');
    });

    // start edit issue
    $('#issues-panel').on('click', '.issue-save', function() {
        var issueId = parseInt($(this).siblings('.issue-id').text()),
            newIssueName = $(this).siblings('.issue-edit').val();
        GTD.tasks.edit(issueId, {name: newIssueName});
    });


    //GTD.makeDraggable();
    GTD.tasks.selector = '#issues-panel';

    GTD.loadData();

});