/*global QUnit*/

sap.ui.define([
	"code/cl3/project1/controller/Project_01.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Project_01 Controller");

	QUnit.test("I should test the Project_01 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
