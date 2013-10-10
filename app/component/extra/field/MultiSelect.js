Ext.define('Extra.field.MultiSelect', {
	extend: 'Ext.field.Text',
	xtype : 'multiselectfield',

	requires: [
		'Ext.Panel',
		'Ext.data.Store',
		'Ext.data.StoreManager',
		'Ext.dataview.List',
		'Ext.ActionSheet'
	],

	/**
	 * @event change
	 * Fires when an option selection has changed
	 * @param {Ext.field.MultiSelect} this
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 */

	/**
	 * @event focus
	 * Fires when this field receives input focus. This happens both when you tap on the field and when you focus on the field by using
	 * 'next' or 'tab' on a keyboard.
	 *
	 * Please note that this event is not very reliable on Android. For example, if your Select field is second in your form panel,
	 * you cannot use the Next button to get to this select field. This functionality works as expected on iOS.
	 * @param {Ext.field.MultiSelect} this This field
	 * @param {Ext.event.Event} e
	 */

	config: {
		/**
		 * @cfg
		 * @inheritdoc
		 */
		ui: 'multiselect',

		/**
		 * @cfg {String/Number} valueField The underlying {@link Ext.data.Field#name data value name} (or numeric Array index) to bind to this
		 * Select control.
		 * @accessor
		 */
		valueField: 'value',

		/**
		 * @cfg {String/Number} displayField The underlying {@link Ext.data.Field#name data value name} (or numeric Array index) to bind to this
		 * Select control. This resolved value is the visibly rendered value of the available selection options.
		 * @accessor
		 */
		displayField: 'text',

		/**
		 * @cfg {Ext.data.Store/Object/String} store The store to provide selection options data.
		 * Either a Store instance, configuration object or store ID.
		 * @accessor
		 */
		store: null,

		/**
		 * @cfg {Array} options An array of select options.
		 *
		 *     [
		 *         {text: 'First Option',  value: 'first'},
		 *         {text: 'Second Option', value: 'second'},
		 *         {text: 'Third Option',  value: 'third'}
		 *     ]
		 *
		 * __Note:__ Option object member names should correspond with defined {@link #valueField valueField} and {@link #displayField displayField} values.
		 * This config will be ignored if a {@link #store store} instance is provided.
		 * @accessor
		 */
		options: null,

		/**
		 * @cfg {String} hiddenName Specify a `hiddenName` if you're using the {@link Ext.form.Panel#standardSubmit standardSubmit} option.
		 * This name will be used to post the underlying value of the select to the server.
		 * @accessor
		 */
		hiddenName: null,

		/**
		 * @cfg {Object} component
		 * @accessor
		 * @hide
		 */
		component: {
			useMask: true
		},

		/**
		 * @cfg {Boolean} clearIcon
		 * @hide
		 * @accessor
		 */
		clearIcon: false,

		/**
		 * @cfg {String/Boolean} usePicker
		 * `true` if you want this component to always use a {@link Ext.ActionSheet}.
		 * `false` if you want it to use a popup overlay {@link Ext.List}.
		 * `auto` if you want to show a {@link Ext.ActionSheet} only on phones.
		 */
		usePicker: true,

		/**
		 * @cfg {Boolean} autoSelect
		 * `true` to auto select the first value in the {@link #store} or {@link #options} when they are changed. Only happens when
		 * the {@link #value} is set to `null`.
		 */
		autoSelect: true,

		/**
		 * @cfg {Object} defaultPhonePickerConfig
		 * The default configuration for the picker component when you are on a phone.
		 */
		defaultPhonePickerConfig: null,

		/**
		 * @cfg {Object} defaultTabletPickerConfig
		 * The default configuration for the picker component when you are on a tablet.
		 */
		defaultTabletPickerConfig: null,

		/**
		 * @cfg
		 * @inheritdoc
		 */
		name: 'picker'
	},

	_aRecords: null,

	// @private
	initialize: function() {
		var me        = this,
			component = me.getComponent();

		me.callParent();

		component.on({
			scope: me,
			masktap: 'onMaskTap'
		});

		component.doMaskTap = Ext.emptyFn;

		if (Ext.browser.is.AndroidStock2)
		{
			component.input.dom.disabled = true;
		}

		if (Ext.theme.name === "Blackberry")
		{
			this.label.on({
				scope: me,
				tap: "onFocus"
			});
		}
	},

	getElementConfig: function() {
		if (Ext.theme.name === "Blackberry")
		{
			var prefix = Ext.baseCSSPrefix;

			return {
				reference: 'element',
				className: 'x-container',
				children: [
					{
						reference: 'innerElement',
						cls: prefix + 'component-outer',
						children: [
							{
								reference: 'label',
								cls: prefix + 'form-label',
								children: [{
									reference: 'labelspan',
									tag: 'span'
								}]
							}
						]
					}
				]
			};
		}
		else
		{
			return this.callParent(arguments);
		}
	},

	/**
	 * @private
	 */
	updateDefaultPhonePickerConfig: function(newConfig) {
		var picker = this.picker;
		if (picker)
		{
			picker.setConfig(newConfig);
		}
	},

	/**
	 * @private
	 */
	updateDefaultTabletPickerConfig: function(newConfig) {
		var listPanel = this.listPanel;
		if (listPanel)
		{
			listPanel.setConfig(newConfig);
		}
	},

	/**
	 * @private
	 * Checks if the value is `auto`. If it is, it only uses the picker if the current device type
	 * is a phone.
	 */
	applyUsePicker: function(usePicker) {
		if (usePicker == "auto")
		{
			usePicker = (Ext.os.deviceType == 'Phone');
		}

		return Boolean(usePicker);
	},

	syncEmptyCls: Ext.emptyFn,

	/**
	 * @private
	 */
	applyValue: function(aValues) {
		if (Ext.isArray(aValues) == false)
		{
			return;
		}

		var self    = this,
			aRecord = [],
			oStore, index;

		self.getOptions();
		oStore = self.getStore();

		if (oStore.getCount() == 0)
		{
			return;
		}

		Ext.Array.each(aValues, function(nValue) {
			index = oStore.find(self.getValueField(), nValue, null, null, null, true);
			aRecord.push(oStore.getAt(index));
		});

		return aRecord;
	},

	getValue: function() {
		if (this._aRecords == null)
		{
			return null;
		}

		var self     = this,
			aRecords = self._aRecords,
			aValues  = [];

		Ext.Array.each(aRecords, function(oRecord) {
			aValues.push(oRecord.get(self.getValueField()));
		});

		return aValues;
	},

	updateValue: function(aValues) {
		if (Ext.isArray(aValues) == false)
		{
			return;
		}

		var self           = this,
			aText          = [];
			self._aRecords = aValues;

		Ext.Array.each(aValues, function(oRecord) {
			aText.push(oRecord.get(self.getDisplayField()));
		});

		var component = this.getComponent(),
			newValue  = aText.join(', '),

		// allows newValue to be zero but not undefined or null (other falsey values)
		valueValid = typeof newValue !== 'undefined' && newValue !== null && newValue !== "";

		if (component)
		{
			component.setValue(newValue);
		}

		this[valueValid && this.isDirty() ? 'showClearIcon' : 'hideClearIcon']();

		this.syncEmptyCls();
	},

	getRecords: function() {
		return this._aRecords;
	},

	// @private
	getPhonePicker: function() {
		var self   = this,
			config = self.getDefaultPhonePickerConfig();

		if (!this.picker)
		{
			this.picker = Ext.create('Ext.ActionSheet', Ext.apply({
				height       : 200,
				padding      : 0,
				hideOnMaskTap: true,
				layout : {
					type : 'hbox',
					align: 'stretch'
				},
				items: [
					{
						flex   : 1,
						xtype  : 'list',
						cls    : Ext.baseCSSPrefix + 'select-overlay',
						mode   : 'MULTI',
						store  : this.getStore(),
						itemTpl: '<span class="x-list-label">{' + this.getDisplayField() + ':htmlEncode}</span>',
						listeners: {
							deselect: this.onListSelect,
							select  : this.onListSelect,
							itemtap : this.onListTap,
							scope   : this
						}
					}
				]
			}, config));
		}

		return this.picker;
	},

	getTabletPicker: function() {
		var config = this.getDefaultTabletPickerConfig();

		if (!this.listPanel)
		{
			this.listPanel = Ext.create('Ext.Panel', Ext.apply({
				cls   : Ext.baseCSSPrefix + 'select-overlay',
				top   : 0,
				left  : 0,
				modal : true,
				width : Ext.os.is.Phone ? '14em' : '18em',
				layout: 'fit',
				height: (Ext.os.is.BlackBerry && Ext.os.version.getMajor() === 10) ? '12em' : (Ext.os.is.Phone ? '12.5em' : '22em'),
				hideOnMaskTap: true,
				items: {
					xtype  : 'list',
					mode   : 'MULTI',
					store  : this.getStore(),
					itemTpl: '<span class="x-list-label">{' + this.getDisplayField() + ':htmlEncode}</span>',
					listeners: {
						select  : this.onListSelect,
						deselect: this.onListSelect,
						itemtap : this.onListTap,
						scope   : this
					}
				}
			}, config));
		}

		return this.listPanel;
	},

	// @private
	onMaskTap: function() {
		this.onFocus();

		return false;
	},

	showPicker: function() {
		var self  = this,
			store = self.getStore(),
			value = self.getValue(),
			oList, oListPanel,
			index, aRecords = [];

		//check if the store is empty, if it is, return
		if (!store || store.getCount() === 0)
		{
			return;
		}

		if (self.getReadOnly())
		{
			return;
		}

		self.isFocused = true;

		if (self.getUsePicker())
		{
			oListPanel = self.getPhonePicker();
			oList      = oListPanel.down('list');

			if (!oListPanel.getParent())
			{
				Ext.Viewport.add(oListPanel);
			}

			oListPanel.show();
		}
		else
		{
			oListPanel = self.getTabletPicker();
			oList      = oListPanel.down('list');

			if (!oListPanel.getParent())
			{
				Ext.Viewport.add(oListPanel);
			}

			oListPanel.showBy(self.getComponent(), null);
		}

		if (value || self.getAutoSelect())
		{
			store  = oList.getStore();

			Ext.Array.each(value, function(nValue) {
				index  = store.find(self.getValueField(), nValue, null, null, null, true);
				aRecords.push(store.getAt(index));
			});

			if (aRecords)
			{
				oList.select(aRecords, null, true);
			}
		}
	},

	onListSelect: function(oList) {
		var self       = this,
			aSelection = oList.getSelection(),
			aValues    = [];

		Ext.Array.each(aSelection, function(oRecord) {
			aValues.push(oRecord.get(self.getValueField()));
		});

		self.setValue(aValues);
	},

	onListTap: function() {
		if (this.listPanel)
		{
			this.listPanel.hide({
				type : 'fade',
				out  : true,
				scope: this
			});
		}

		if (this.picker)
		{
			this.picker.hide();
		}
	},

	onChange: function(component, newValue, oldValue) {
		var me            = this,
			aOldValue     = oldValue.split(', '),
			oStore        = me.getStore(),
			sDisplayField = me.getDisplayField(),
			nIndex, oRecord, aOldValues = [];

		Ext.Array.each(aOldValue, function(sValue) {
			nIndex  = (oStore) ? oStore.find(sDisplayField, sValue, null, null, null, true) : -1;
			oRecord = (oStore) ? oStore.getAt(nIndex) : null;

			if (oRecord)
			{
				aOldValues.push(oRecord.get(me.getValueField()));
			}
		});

		me.fireEvent('change', me, me.getValue(), aOldValues);
	},

	/**
	 * Updates the underlying `<options>` list with new values.
	 *
	 * @param {Array} newOptions An array of options configurations to insert or append.
	 *
	 *     selectBox.setOptions([
	 *         {text: 'First Option',  value: 'first'},
	 *         {text: 'Second Option', value: 'second'},
	 *         {text: 'Third Option',  value: 'third'}
	 *     ]).setValue('third');
	 *
	 * __Note:__ option object member names should correspond with defined {@link #valueField valueField} and
	 * {@link #displayField displayField} values.
	 *
	 * @return {Ext.field.Select} this
	 */
	updateOptions: function(newOptions) {
		var store = this.getStore();

		if (!store)
		{
			this.setStore(true);
			store = this._store;
		}

		if (!newOptions)
		{
			store.clearData();
		}
		else
		{
			store.setData(newOptions);
			this.onStoreDataChanged(store);
		}
		return this;
	},

	applyStore: function(store) {
		if (store === true)
		{
			store = Ext.create('Ext.data.Store', {
				fields     : [this.getValueField(), this.getDisplayField()],
				autoDestroy: true
			});
		}

		if (store)
		{
			store = Ext.data.StoreManager.lookup(store);

			store.on({
				scope        : this,
				addrecords   : 'onStoreDataChanged',
				removerecords: 'onStoreDataChanged',
				updaterecord : 'onStoreDataChanged',
				refresh      : 'onStoreDataChanged'
			});
		}

		return store;
	},

	updateStore: function(newStore) {
		if (newStore)
		{
			this.onStoreDataChanged(newStore);
		}

		if (this.getUsePicker() && this.picker)
		{
			this.picker.down('dataview').setStore(newStore);
		}
		else if (this.listPanel)
		{
			this.listPanel.down('dataview').setStore(newStore);
		}
	},

	/**
	 * Called when the internal {@link #store}'s data has changed.
	 */
	onStoreDataChanged: function(store) {
		var initialConfig = this.getInitialConfig(),
			value         = this.getValue();

		if (value || value == 0)
		{
			this.updateValue(this.applyValue(value));
		}

		if (this.getValue() === null)
		{
			if (initialConfig.hasOwnProperty('value'))
			{
				this.setValue(initialConfig.value);
			}

			if (this.getValue() === null && this.getAutoSelect())
			{
				if (store.getCount() > 0)
				{
					this.setValue([store.getAt(0).get(this.getValueField())]);
				}
			}
		}
	},

	/**
	 * @private
	 */
	doSetDisabled: function(disabled) {
		var component = this.getComponent();
		if (component)
		{
			component.setDisabled(disabled);
		}
		Ext.Component.prototype.doSetDisabled.apply(this, arguments);
	},

	/**
	 * @private
	 */
	setDisabled: function() {
		Ext.Component.prototype.setDisabled.apply(this, arguments);
	},

	// @private
	updateLabelWidth: function() {
		if (Ext.theme.name === "Blackberry")
		{
			return;
		}
		else
		{
			this.callParent(arguments);
		}
	},

	// @private
	updateLabelAlign: function() {
		if (Ext.theme.name === "Blackberry")
		{
			return;
		}
		else
		{
			this.callParent(arguments);
		}
	},

	/**
	 * Resets the MultiSelect field to the value of the first record in the store.
	 * @return {Ext.field.MultiSelect} this
	 * @chainable
	 */
	reset: function() {
		var store = this.getStore(),
			record = (this.originalValue) ? this.originalValue : [store.getAt(0).get(this.getValueField())];

		if (store && record)
		{
			this.setValue(record);
		}

		return this;
	},

	onFocus: function(e) {
		if (this.getDisabled())
		{
			return false;
		}

		var component = this.getComponent();
		this.fireEvent('focus', this, e);

		if (Ext.os.is.Android4)
		{
			component.input.dom.focus();
		}
		component.input.dom.blur();

		this.isFocused = true;

		this.showPicker();
	},

	destroy: function() {
		this.callParent(arguments);
		var store = this.getStore();

		if (store && store.getAutoDestroy())
		{
			Ext.destroy(store);
		}

		Ext.destroy(this.listPanel, this.picker);
	}
});
