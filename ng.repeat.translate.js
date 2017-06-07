'use strict';

angular.module('filApp')
    .directive('ngRepeatTranslate', function($translatePartialLoader, $translate, $timeout, $compile, $q) {
        return {
            compile: function($elem, $attr) {

                /** Declaration section */
                var args = $attr.ngRepeatTranslate.split(' ');
                var itemName = args[0];
                var translationKey = args[2];
                var i18jsonName = translationKey.split('.')[0];
                var optionalVars;


                /** Methods section */
                var getVariablesFromString = function(str) {
                    return _.map(str.match(/{{.*?}}/g), function(item) {
                        return item.replace(/{{|}}/g, '');
                    });
                };


                /** Init section */
                /** Temporarily prevent ng-include */
                _.forEach($elem.find('[ng-include]'), function(elem) {
                    $(elem).attr('include', $(elem).attr('ng-include'));
                    $(elem).removeAttr('ng-include');
                });

                optionalVars = getVariablesFromString(translationKey);

                return {
                    post: function($scope, $elem){

                        /** Declaration section */
                        var clone = $elem.clone();
                        var promises = [];
                        var filledTranslationKey;
                        $scope.translations = [];


                        /** Methods section */
                        var checkScope = function() {
                            var scopeArgs = {};
                            _.forEach(optionalVars, function(optVar) {
                                if (optVar.split('.').length > 1) {
                                    _.forEach(optVar.split('.'), function(item) {
                                        scopeArgs[optVar] = scopeArgs[optVar]
                                            ? item.indexOf('()') === -1
                                                ? scopeArgs[optVar][item] : scopeArgs[optVar][item.replace('()', '')]()
                                            : $scope[item];
                                    });
                                } else {
                                    scopeArgs[optVar] = $scope[optVar];
                                }
                            });
                            return scopeArgs;
                        };

                        var isTranslationKeyResolved = function() {
                            return _.isEmpty(getVariablesFromString($attr.ngRepeatTranslate.split(' ')[2]));
                        };

                        var validateOptionals = function(cancelTimeout) {
                            var deffered = $q.defer();
                            promises.push(deffered.promise);

                            var timer = $timeout(function() {
                                watcher();
                                deffered.resolve();
                            }, cancelTimeout || 500);

                            var watcher = $scope.$watch(function() {
                                return _.size(checkScope()) === _.size(optionalVars);
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
                                filledTranslationKey = filledTranslationKey.replace('{{' + key + '}}', value);
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
                            _.forEach(clone.find('[include]'), function(elem) {
                                $(elem).attr('ng-include', $(elem).attr('include'));
                                $(elem).removeAttr('include');
                            });

                            $compile(clone)($scope);
                            $elem.replaceWith(clone);
                        };

                        var init = function() {
                            updateTranslation();
                            if (!isTranslationKeyResolved()) validateOptionals();
                            $q.all(promises).then(function() {
                                translationKeyFillArgs();
                                translateArray();
                                compileToScope();
                                enableScopeWatcher();
                            });
                        };

                        var isScopeVarsChanged = function(scopeStamp) {
                            return _.some(checkScope(), function(value, key) {
                                return scopeStamp[key] !== value;
                            });
                        }


                        /** Watchers section */
                        var enableScopeWatcher = function() {
                            var scopeStamp = checkScope();
                            $scope.$watch(function() {
                                return isScopeVarsChanged(scopeStamp);
                            }, function(hasChanges) {
                                if (hasChanges) {
                                    scopeStamp = checkScope();
                                    $scope.translations = [];
                                    translationKeyFillArgs();
                                    translateArray();
                                }
                            });
                        }


                        /** Init section */
                        init();

                    }
                };
            }
        };
});
