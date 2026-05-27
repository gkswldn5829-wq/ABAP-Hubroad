/*global QUnit*/

sap.ui.define([
	"code/cl3/project02/controller/Project_02.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Project_02 Controller");

	QUnit.test("I should test the Project_02 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
