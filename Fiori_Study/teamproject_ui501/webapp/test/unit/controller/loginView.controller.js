/*global QUnit*/

sap.ui.define([
	"code/cl3/teamprojectui501/controller/loginView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("loginView Controller");

	QUnit.test("I should test the loginView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
