'use strict';

angular.module('filApp')
    .directive('ngRepeatTranslate', function($translatePartialLoader, $translate, $timeout, $compile, $q) {
        return {
            link : function($scope, $elem, $attr) {
                /**********************************************************************/
                /*************************** README ***********************************/
                /**********************************************************************/
                /**
                /** Directive to repeat translation keys defined as arrays.
                /**
                /**
                /**********************************************************************/
                /*************************** NOTICE ***********************************/
                /**********************************************************************/
                /**********************************************************************/
                /**
                /** 1. If translation key include angular expression (i.e {{var}}), use
                /**     single brace;
                /**
                /** 2. In case of using ng-include inside please replace:
                /**    'ng-include' with 'include';
                /**
                /**********************************************************************/

                /** Declaration section */
                var clone = $($elem).clone();

                $scope.translations = [];
                var promises = [];
                var filledTranslationKey;
                var args = $attr.ngRepeatTranslate.split(' ');
                var itemName = args[0];
                var translationKey = args[2];
                var optionalVars = _.map(translationKey.match(/{.*?}/g), function(item) {
                    return item.replace(/{|}/g, '');
                });

                var i18jsonName = translationKey.split('.')[0];


                /** Methods section */
                var checkScope = function() {
                    var scopeArgs = {};
                    _.forEach(optionalVars, function(item) {
                        scopeArgs[item] = $scope[item];
                    });
                    return scopeArgs;
                };

                var validateOptionals = function(cancelTimeout) {
                    var deffered = $q.defer();
                    promises.push(deffered.promise);

                    var timer = $timeout(function() {
                        watcher();
                        deffered.resolve();
                    }, cancelTimeout || 500);

                    var watcher = $scope.$watch(function() {
                        return !_.some(_.isEmpty(checkScope()));
                    }, function(ready) {
                        if (ready) {
                            watcher();
                            $timeout.cancel(timer);
                            deffered.resolve();
                        }
                    });
                };

                var updateTranslation = function() {
                    $translatePartialLoader.addPart(i18jsonName);
                    promises.push($translate.refresh());
                };

                var translationKeyFillArgs = function() {
                    filledTranslationKey = translationKey;
                    _.forEach(checkScope(), function(value, key) {
                        filledTranslationKey = filledTranslationKey.replace('{' + key + '}', value);
                    });
                };

                var translateArray = function(cancelTimeout) {
                    var hasNext = true;
                    var i = 0;
                    var timer = $timeout(function() {
                        hasNext = false;
                    },cancelTimeout || 500);

                    while(hasNext) {
                        var key = filledTranslationKey + '.' + i;
                        var value = $translate.instant(key);
                        if (key == value) {
                            hasNext = false;
                        } else {
                            $scope.translations.push(value);
                            i++;
                        }
                    }
                    $timeout.cancel(timer);
                };

                var compileToScope = function() {
                    clone.removeAttr('ng-repeat-translate');
                    clone.attr('ng-repeat', itemName + " in translations track by $index");
                    clone.attr('ng-repeat', itemName + " in translations track by $index");
                    _.forEach(clone.find('[include]'), function(elem) {
                        $(elem).attr('ng-include', $(elem).attr('include'));
                        $(elem).removeAttr('include');
                    });

                    $compile(clone)($scope);
                    $elem.replaceWith(clone);
                };

                var init = function() {
                    updateTranslation();
                    validateOptionals();
                    $q.all(promises).then(function() {
                        translationKeyFillArgs();
                        translateArray();
                        compileToScope();
                    });
                };


                /** Init section */
                init();

            }
        };
});
