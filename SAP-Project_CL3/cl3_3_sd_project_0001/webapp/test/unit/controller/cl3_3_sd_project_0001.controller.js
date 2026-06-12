/*global QUnit*/

sap.ui.define([
	"zcl33sdns/cl33sdproject0001/controller/cl3_3_sd_project_0001.controller"
], function (Controller) {
	"use strict";

	QUnit.module("cl3_3_sd_project_0001 Controller");

	QUnit.test("I should test the cl3_3_sd_project_0001 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
