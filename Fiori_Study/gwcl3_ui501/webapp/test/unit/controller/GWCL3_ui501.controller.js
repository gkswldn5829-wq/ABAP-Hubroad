/*global QUnit*/

sap.ui.define([
	"code/cl3/gwcl3ui501/controller/GWCL3_ui501.controller"
], function (Controller) {
	"use strict";

	QUnit.module("GWCL3_ui501 Controller");

	QUnit.test("I should test the GWCL3_ui501 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
