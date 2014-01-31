var GTD = GTD || {};

GTD.taskStatus = {
    NOT_STARTED: 1,
    IN_PROGRESS: 2,
    DONE: 3
};

GTD.taskType = {
    TASK: 1,
    BUG: 2
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
        self.saveData();
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
        self.saveData();

    },
    remove: function(id) {
        var self = this;
        _.each(self.data, function(task, index) {
            if (task.id == id) {
                self.data.splice(index, 1);
            }
        });
        self.draw();
        self.saveData();
    },
    draw: function() {
        var self = this,
            $parent = $(this.selector),
            $not_started, $inprogress, $finished; // 3 columns to output task/bugs

        $parent.html('');
        $not_started = $('<div id="not-started" class="col-md-4 progress-col"><h2>Not started</h2></div>');
        $parent.append($not_started)
        $inprogress = $('<div id="in-progress" class="col-md-4 progress-col"><h2>In progress</h2></div>');
        $parent.append($inprogress)
        $finished = $('<div id="finished" class="col-md-4 progress-col"><h2>Done</h2></div>');
        $parent.append($finished);

        _.each(self.data, function(task) {
            var issueTypeClassName = (task.type == 1) ? 'task' : 'bug',
                $task = $('<div class="issue jumbotron ' + issueTypeClassName+'">' +
                            '<div class="close">X</div>' +
                            '<span class="issue-id">' + task.id + ' </span>'  +
                            '<span class="issue-name"> ' + task.name + ' </span>' +
                            '<input class="issue-edit" type="text" placeholder="' + task.name + '" value="' + task.name+ '" />' +
                            '<button class="issue-save btn btn-primary">Save</button> ' +
                        '</div>');

            $task.draggable({
                stop: function( event, ui ) {
                    //console.log(event, ui);
                    _.each($('.progress-col'), function(column) {
                        var $column = $(column);
                        if (($column.offset().left <= ui.offset.left) && ($column.offset().left + $column.width() >= ui.offset.left) &&
                            ($column.offset().top <= ui.offset.top) && ($column.offset().top + $column.height() >= ui.offset.top)) {

                            var dragElementId = $(event.target).children('.issue-id').text();
                            var newStatus;

                            switch (column.id) {
                                case 'not-started':
                                        newStatus = GTD.taskStatus.NOT_STARTED;
                                    break;
                                case 'in-progress':
                                    newStatus = GTD.taskStatus.IN_PROGRESS;
                                    break;
                                case 'finished':
                                    newStatus = GTD.taskStatus.DONE;
                                    break;
                            }
                            self.edit(dragElementId, {status: newStatus});
                            self.draw();

                        }  else {
                            $(event.target).css({left: 0, top: 0});
                        }
                    });
                }
            });


            switch(task.status) {
                case GTD.taskStatus.NOT_STARTED:
                        $not_started.append($task);
                    break;
                case GTD.taskStatus.IN_PROGRESS:
                        $inprogress.append($task);
                    break;
                case GTD.taskStatus.DONE:
                        $finished.append($task);
                    break;
                default:
                        $not_started.append($task);
                    break;
            }
        });
    },
    saveData: function() {
        localStorage.setItem(GTD.localStorageDataName, JSON.stringify(this.data));
    },
    loadData: function() {
        var data = localStorage.getItem(GTD.localStorageDataName);
        if (data) {
            this.data = JSON.parse(data);
        } else {
            this.data = GTD.tasksList;
        }
        GTD.tasks.draw();
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


    $('#add-new-task').draggable({
        stop: function( event, ui ) {
            _.each($('.progress-col'), function(column) {
                var $column = $(column);
                if (($column.offset().left <= ui.offset.left) && ($column.offset().left + $column.width() >= ui.offset.left) &&
                    ($column.offset().top <= ui.offset.top) && ($column.offset().top + $column.height() >= ui.offset.top)) {

                    // get new id
                    var dragElementId = 1 + _.max(GTD.tasks.data, function(task) {
                        return task.id;
                    }).id;
                    var newStatus, newType;

                    switch (column.id) {
                        case 'not-started':
                            newStatus = GTD.taskStatus.NOT_STARTED;
                            break;
                        case 'in-progress':
                            newStatus = GTD.taskStatus.IN_PROGRESS;
                            break;
                        case 'finished':
                            newStatus = GTD.taskStatus.DONE;
                            break;
                    }

                    newType = $('#issue-type').val();
                    GTD.tasks.add({id: dragElementId, name: 'New Issue', type: newType, status: newStatus})

                }  else {
                    $(event.target).css({left: 0, top: 0});
                }
            });
        }
    });

    GTD.tasks.selector = '#issues-panel';
    GTD.tasks.loadData();


});