agGrid.initialiseAgGridWithAngular1(angular);
var depthspace = angular.module('depthspace', ['ui.bootstrap', 'ngRoute', 'angularFileUpload', 'agGrid']);
depthspace.config(['$routeProvider', '$locationProvider', '$sceProvider', function ($routeProvider, $locationProvider, $sceProvider) {
    $routeProvider
	.when('/constructing', {
            templateUrl: 'constructing.html',
            controller: 'BlankCtrl'
	})
	.when('/home', {
            templateUrl: 'home.html',
            controller: 'HomeCtrl'
	})
	.when('/about', {
            templateUrl: 'about.html',
            controller: 'BlankCtrl'
	})
	.when('/algorithm', {
            templateUrl: 'algorithm.html',
            controller: 'BlankCtrl'
	})
	.when('/security', {
            templateUrl: 'security.html',
            controller: 'BlankCtrl'
	})
	.when('/audit', {
            templateUrl: 'audit.html',
            controller: 'BlankCtrl'
	})
	.when('/query', {
            templateUrl: 'query.html',
            controller: 'QueryCtrl'
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

depthspace.controller('HomeCtrl',function($scope, $http, $location) {
    need_login($scope, $http, $location, function(){
        $location.path('/class/list');
        $scope.status.done = true;
    }, function(){
        $location.path('/account/login');
    });
});


depthspace.controller('BlankCtrl',function($scope, $http, $location) {
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

depthspace.controller('QueryCtrl',function($scope, $http, $location) {
    $scope.n_per_1yuan = 10*100000000;
    $scope.price_min = 100;
    $scope.price_max = 10000;

    $scope.point_type = 1;
    $scope.point_num1 = 1000;

    $scope.area = 100;
    $scope.point_per_m2 = 1;
    $scope.point_num2 = parseFloat($scope.area) * parseFloat($scope.point_per_m2);

    $scope.tri_num = 100;


    var alg = function(name, price, f){
	return {
	    'name': name,
	    'price': price,
	    'f': f,
	}
    };

    $scope.algorithmArr = [];

    var append_alg = function(name, f){
	$scope.algorithmArr.push(alg(name, 0, f));
    };

    append_alg('VID', function(P,T){
	return $scope.getPriceVid(P,T);
    });
    append_alg('VOD', function(P,T){
	return $scope.getPriceVod(P,T);
    });
    append_alg('MSP', function(P,T){
	return $scope.getPriceMsp(P,T);
    });
    append_alg('TSP', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('MSP through IR', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('TSP through IR', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('VA%', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('VVod', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('VVid', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('VConnectivity', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('VIntegration[HH]', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('VControl', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('VControlability', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('VEntropy', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('VClusteringCoefficient', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('DepthMap数据提取到DepthSpace', function(P,T){
	return $scope.getPriceTsp(P,T);
    });
    append_alg('其他GIS功能', function(P,T){
	return $scope.getPriceTsp(P,T);
    });

    $scope.onPointNum1Change = function(){
	console.log('point num change to:', $scope.point_num1);
	$scope.onChange();
    };

    $scope.onAreaChange = function(){
	console.log('on area change:', $scope.area);
	$scope.point_num2 = $scope.area * $scope.point_per_m2;
	$scope.onChange();
    };

    $scope.onPointPerM2Change = function(){
	console.log('on point per m2 change:', $scope.point_per_m2);
	$scope.point_num2 = $scope.area * $scope.point_per_m2;
	$scope.onChange();
    };

    $scope.onTriNumChange = function() {
	console.log('on tri numchange:', $scope.tri_num);
	$scope.onChange();
    };

    $scope.onPointType1Click = function(){
	$scope.point_type = 1;
	console.log('point type:', $scope.point_type);
	$scope.onChange();
    };

    $scope.onPointType2Click = function(){
	$scope.point_type = 2;
	console.log('point type:', $scope.point_type);
	$scope.onChange();
    };

    $scope.onChange = function(){
	var P = 0;
	
	if($scope.point_type == 1){
	    P = $scope.point_num1;
	}
	else if($scope.point_type == 2){
	    P = $scope.point_num2;
	}
	var T = $scope.tri_num;

	angular.forEach($scope.algorithmArr, function(alg,index,arr){
	    var price = alg.f(P, T);
	    if(price < $scope.price_min){
		price = $scope.price_min;
	    }
	    if(price > $scope.price_max){
		price = '>' + $scope.price_max;
	    }
	    alg.price = price;
	    console.log(alg.name, ':', alg.price);
	});
    };


    $scope.getPriceVid = function(P, T){
	var n = P*P*T;
	console.log(n);
	var fee = 1.0 * n / $scope.n_per_1yuan;
	fee = Math.ceil(fee);
	return fee;
    };

    $scope.getPriceVod = function(P, T){
	return $scope.getPriceVid(P, T);
    };

    $scope.getPriceMsp = function(P, T){
	var n = P*P*T + P*P*P;
	console.log(n);
	var fee = 1.0 * n / $scope.n_per_1yuan;
	fee = Math.ceil(fee);
	return fee;
    };

    $scope.getPriceTsp = function(P, T){
	return $scope.getPriceMsp(P, T);
    };

    $scope.onChange();

});
