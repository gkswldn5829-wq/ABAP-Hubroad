/*global QUnit*/

sap.ui.define([
	"code/cl3/pararoute01/controller/Main_VIew.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Main_VIew Controller");

	QUnit.test("I should test the Main_VIew controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
