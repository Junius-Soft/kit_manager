# Copyright (c) 2024, kit_management and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import flt


def execute(filters=None):
	if not filters:
		filters = {}

	columns = get_columns(filters)
	data = get_data(filters)

	return columns, data


def get_columns(filters):
	"""Return columns based on filters"""
	
	columns = [
		_("Ürün Kodu") + ":Link/Item:150",
		_("Ürün Adı") + "::300",
		_("Ürün Grubu") + ":Link/Item Group:200",
		_("Birim") + ":Link/UOM:100",
	]
	
	# Kit modunda sadece Bayi Kit Fiyatı göster
	if filters.get("kit"):
		columns.append(_("Bayi Kit Fiyatı") + ":Currency:150")
	else:
		# Normal modda sadece Müşteri Fiyatı ve Satış Fiyatı göster (kit olmayan ürünler için)
		columns.extend([
			_("Müşteri Fiyatı") + ":Currency:150",
			_("Satış Fiyatı") + ":Currency:150",
		])
	
	return columns


def get_data(filters):
	"""Get report data based on filters"""
	
	# Fiyat listesi isimleri
	BAYI_KIT_FIYATI = "Bayi Kit Fiyatı"
	MUSTERI_FIYATI = "Müşteri Fiyatı"
	SATIS_FIYATI = "Satış Fiyatı"
	
	# Item query oluştur
	item = frappe.qb.DocType("Item")
	query = (
		frappe.qb.from_(item)
		.select(
			item.name.as_("item_code"),
			item.item_name,
			item.item_group,
			item.stock_uom
		)
	)
	
	# Kit filtresi
	if filters.get("kit"):
		# Kit seçiliyse sadece kit ürünlerini göster
		query = query.where(item.custom_kit == 1)
	else:
		# Kit seçili değilse sadece kit olmayan ürünleri göster
		query = query.where((item.custom_kit == 0) | (item.custom_kit.isnull()))
	
	# Ürün Kodu filtresi (Link olduğu için tam eşleşme)
	item_code_filter = filters.get("item_code")
	if item_code_filter:
		query = query.where(item.name == item_code_filter)
	
	# Ürün Adı filtresi (Link olduğu için seçilen Item'ın item_name'ini kullan)
	item_name_filter = filters.get("item_name")
	if item_name_filter:
		# Link fieldtype kullanıldığında item_name aslında item_code döner
		# Seçilen Item'ın item_name'ini al
		selected_item_name = frappe.db.get_value("Item", item_name_filter, "item_name")
		if selected_item_name:
			query = query.where(item.item_name == selected_item_name)
	
	# Ürün Grubu filtresi
	item_group_filter = filters.get("item_group")
	if item_group_filter:
		query = query.where(item.item_group == item_group_filter)
	
	# Sadece aktif ürünler
	query = query.where(item.disabled == 0)
	
	# Sıralama
	query = query.orderby(item.item_code)
	
	items = query.run(as_dict=True)
	
	# Fiyatları al
	item_codes = [item.item_code for item in items]
	
	# Fiyatları al - kit seçiliyse Bayi Kit Fiyatı, değilse Müşteri ve Satış Fiyatı
	if filters.get("kit"):
		price_lists = [BAYI_KIT_FIYATI]
	else:
		price_lists = [MUSTERI_FIYATI, SATIS_FIYATI]
	
	price_map = get_price_map(item_codes, price_lists)
	
	# Veriyi hazırla
	data = []
	for item in items:
		row = [
			item.item_code,
			item.item_name,
			item.item_group,
			item.stock_uom,
		]
		
		if filters.get("kit"):
			# Kit modunda sadece Bayi Kit Fiyatı
			bayi_kit_fiyati = price_map.get(item.item_code, {}).get(BAYI_KIT_FIYATI, 0)
			row.append(flt(bayi_kit_fiyati, 2))
		else:
			# Normal modda sadece Müşteri Fiyatı ve Satış Fiyatı (kit olmayan ürünler için)
			musteri_fiyati = price_map.get(item.item_code, {}).get(MUSTERI_FIYATI, 0)
			satis_fiyati = price_map.get(item.item_code, {}).get(SATIS_FIYATI, 0)
			
			row.extend([
				flt(musteri_fiyati, 2),
				flt(satis_fiyati, 2),
			])
		
		data.append(row)
	
	return data


def get_price_map(item_codes, price_lists):
	"""Get prices for items from specified price lists"""
	
	if not item_codes:
		return {}
	
	item_price = frappe.qb.DocType("Item Price")
	
	query = (
		frappe.qb.from_(item_price)
		.select(
			item_price.item_code,
			item_price.price_list,
			item_price.price_list_rate
		)
		.where(
			(item_price.item_code.isin(item_codes)) &
			(item_price.price_list.isin(price_lists))
		)
	)
	
	prices = query.run(as_dict=True)
	
	# Fiyatları organize et
	price_map = {}
	for price in prices:
		if price.item_code not in price_map:
			price_map[price.item_code] = {}
		price_map[price.item_code][price.price_list] = price.price_list_rate
	
	return price_map
