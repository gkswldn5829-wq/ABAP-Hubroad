/*global QUnit*/

sap.ui.define([
	"code/cl3/precticeui506/controller/prectice_ui5_06.controller"
], function (Controller) {
	"use strict";

	QUnit.module("prectice_ui5_06 Controller");

	QUnit.test("I should test the prectice_ui5_06 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
