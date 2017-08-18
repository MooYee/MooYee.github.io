agGrid.initialiseAgGridWithAngular1(angular);
var depthspace = angular.module('depthspace', ['ui.bootstrap', 'ngRoute', 'angularFileUpload', 'agGrid']);
depthspace.config(['$routeProvider', '$locationProvider', '$sceProvider', function ($routeProvider, $locationProvider, $sceProvider) {
    $routeProvider
    .when('/home', {
        templateUrl: 'home.html',
        controller: 'HomeCtl'
    })
    .when('/about', {
        templateUrl: 'about.html',
        controller: 'BlankCtl'
    })
    .when('/algorithm', {
        templateUrl: 'algorithm.html',
        controller: 'BlankCtl'
    })
    .when('/vid-demo', {
        templateUrl: 'vid-demo.html',
        controller: 'VidDemoCtrl'
    })
    .when('/vod-demo', {
        templateUrl: 'vod-demo.html',
        controller: 'VodDemoCtrl'
    })
    .when('/tsp-demo', {
        templateUrl: 'tsp-demo.html',
        controller: 'TspDemoCtrl'
    })
    .otherwise({
        redirectTo: '/home'
    });
}]);

depthspace.directive("compareTo", function() {
    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {

            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };

            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
});

depthspace.filter('htmlContent',['$sce', function($sce) {
    return function(input) {
        return $sce.trustAsHtml(input);
    }
}]);


// helper
var API_URL = '/depthspace/api'

function api($http, name, data){
    if(typeof(data) == 'undefined'){
        data = {};
    }
    
    headers = csrf_cookie_header();
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    return $http({
        method:'POST',
        headers: headers,
        url: API_URL + '/' + name,
        data: data,
        transformRequest: function(obj) {
            var str = [];
            for(var p in obj){
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            return str.join("&");
        },
    });
}

function need_login($scope, $http, $location, success, error){
    $scope.status = {};
    $scope.status.inited = false;
    $scope.status.logged = false;
    $scope.status.done = false;
    $scope.user = {}
    api($http, 'profile').success(function(data, header, config, status){
        antdebug(data);

        if(data.error_code == 0){
            $scope.user.name = data.name;
            $scope.user.mail = data.mail;
            $scope.user.phone = data.phone;
            if(typeof(success)!='undefined'){
                success();
            }else{
                $scope.status.done = true;
            }
            $scope.status.logged = true;
        }else{
            if(typeof(error)!='undefined'){
                error();
            }
            $scope.status.logged = false;
            $scope.status.done = true;
        }
        $scope.status.inited = true;
    }).error(function(data, header, config, status){
        antdebug(data);
        if(typeof(error)!='undefined'){
            error();
        }
        $scope.status.inited = true;
    });
    
    $scope.onClickLogin = function(){
        $location.path('/account/login');
    };
    
    $scope.onClickLogout = function(){
        $location.path('/account/logout');
    };
    $scope.onClickRegister = function(){
        $location.path('/account/register');
    };
}

function create_breadcrumb($scope, current){
    var navList = [];
    function nav_item(title, href){
        var item = {};
        item.title = title;
        item.href = href;
        item.isActive = false;
        return item;        
    }
    
    function nav_push(title, href){
        navList.push(nav_item(title, href));
    }
    if(typeof($scope.user) != 'undefined'){
        nav_push($scope.user.name, '#/class/list');
    }
    if(typeof($scope.cls) != 'undefined'){
        nav_push($scope.cls.name, '#/class/view/' + $scope.cls.token);
    }
    if(typeof($scope.sheet) != 'undefined'){
        nav_push($scope.sheet.name + ' (' + $scope.sheet.origin + ')', '#/sheet/view/' + $scope.sheet.token);
    }
    if(typeof($scope.depthspace) != 'undefined'){
        nav_push($scope.depthspace.name, '#/depthspace/view/' + $scope.depthspace.token);
    }
    
    if(typeof(current) != 'undefined'){
        if(current == ''){
            //
        }else{
            nav_push(current, '#');
            navList[navList.length-1].isActive=true;
        }
    }
    
    $scope.breadcrumb = {};
    $scope.breadcrumb.navList = navList;
}

// controller
depthspace.controller('NavbarCtrl', function ($scope, $location) {
    $scope.isActive = function (route) {
        var drops = ['/account', '/file'];
        var i = 0;
        var n = drops.length;
        for(i = 0; i < n; i++){
            var drop = drops[i];
            if ($location.path().indexOf(drop) == 0) {
                return route === drop;
            }
        }
        return route === $location.path();
    }
});

depthspace.controller('HomeCtl',function($scope, $http, $location) {
    need_login($scope, $http, $location, function(){
        $location.path('/class/list');
        $scope.status.done = true;
    }, function(){
        $location.path('/account/login');
    });
});


depthspace.controller('BlankCtl',function($scope, $http, $location) {
});

depthspace.controller('VidDemoCtrl',function($scope, $http, $location) {
	$scope.vidDemo = new XRay('vid-demo');
});

depthspace.controller('VodDemoCtrl',function($scope, $http, $location) {
	$scope.vidDemo = new XRay('vod-demo');
});

depthspace.controller('TspDemoCtrl',function($scope, $http, $location) {
	$scope.vidDemo = new XRay('tsp-demo');
});