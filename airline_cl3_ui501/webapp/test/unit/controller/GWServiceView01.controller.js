/*global QUnit*/

sap.ui.define([
	"code/cl3/airlinecl3ui501/controller/GWServiceView01.controller"
], function (Controller) {
	"use strict";

	QUnit.module("GWServiceView01 Controller");

	QUnit.test("I should test the GWServiceView01 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
