import React, { useState, useEffect } from 'react';
import { CategoryRow, SubcategoryRow } from '../../types';
import { listCategories, upsertCategory, deleteCategory, listSubcategories, upsertSubcategory, deleteSubcategory } from '../../cms';
import { useAdmin } from '../../context/AdminContext';
import { Trash2, Plus, GripVertical, ChevronRight, Check, X, Edit2 } from 'lucide-react';

interface CategoryManagerProps {
    isDarkMode: boolean;
    onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ isDarkMode, onClose }) => {
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(null);
    const [subcategories, setSubcategories] = useState<SubcategoryRow[]>([]);
    const [loading, setLoading] = useState(false);

    // Edit states
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [catNameEdit, setCatNameEdit] = useState('');
    const [editingSubId, setEditingSubId] = useState<string | null>(null);
    const [subNameEdit, setSubNameEdit] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadSubcategories(selectedCategory.id);
        } else {
            setSubcategories([]);
        }
    }, [selectedCategory]);

    async function loadCategories() {
        setLoading(true);
        const { data } = await listCategories();
        if (data) setCategories(data);
        setLoading(false);
    }

    async function loadSubcategories(catId: string) {
        setLoading(true);
        const { data } = await listSubcategories(catId);
        if (data) setSubcategories(data);
        setLoading(false);
    }

    // Category Handlers
    async function handleAddCategory() {
        const label = prompt("Nome da nova categoria:");
        if (!label) return;
        const slug = label.toUpperCase().replace(/\s+/g, '_');
        await upsertCategory({ label, slug, sort_order: categories.length * 10 } as any);
        loadCategories();
    }

    async function handleUpdateCategory(cat: CategoryRow) {
        if (!catNameEdit.trim()) return;
        await upsertCategory({ ...cat, label: catNameEdit });
        setEditingCatId(null);
        loadCategories();
    }

    async function handleDeleteCategory(id: string) {
        if (confirm("Tem certeza? Isso apagará todas as subcategorias também.")) {
            await deleteCategory(id);
            if (selectedCategory?.id === id) setSelectedCategory(null);
            loadCategories();
        }
    }

    // Subcategory Handlers
    async function handleAddSubcategory() {
        if (!selectedCategory) return;
        const label = prompt("Nome da subcategoria:");
        if (!label) return;
        const slug = label.toLowerCase().replace(/\s+/g, '-');
        await upsertSubcategory({
            label,
            slug,
            category_id: selectedCategory.id,
            sort_order: subcategories.length * 10
        } as any);
        loadSubcategories(selectedCategory.id);
    }

    async function handleUpdateSubcategory(sub: SubcategoryRow) {
        if (!subNameEdit.trim()) return;
        await upsertSubcategory({ ...sub, label: subNameEdit });
        setEditingSubId(null);
        if (selectedCategory) loadSubcategories(selectedCategory.id);
    }

    async function handleDeleteSubcategory(id: string) {
        if (confirm("Apagar subcategoria?")) {
            await deleteSubcategory(id);
            if (selectedCategory) loadSubcategories(selectedCategory.id);
        }
    }

    const baseClass = isDarkMode ? 'bg-[#121212] text-white border-white/10' : 'bg-white text-black border-black/10';
    const itemClass = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5';

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-4xl h-[80vh] rounded-[32px] border shadow-2xl flex overflow-hidden ${baseClass}`}>

                {/* Categories Column */}
                <div className={`w-1/2 border-r ${isDarkMode ? 'border-white/10' : 'border-black/10'} flex flex-col`}>
                    <div className="p-6 border-b border-inherit flex justify-between items-center">
                        <h2 className="font-black text-xl uppercase tracking-tight">Categorias</h2>
                        <button onClick={handleAddCategory} className="p-2 bg-yellow-400 text-black rounded-full hover:scale-110 transition-transform">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat)}
                                className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${selectedCategory?.id === cat.id ? 'bg-yellow-400 text-black' : itemClass} ${isDarkMode && selectedCategory?.id !== cat.id ? 'bg-white/5' : ''}`}
                            >
                                {editingCatId === cat.id ? (
                                    <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                                        <input
                                            value={catNameEdit}
                                            onChange={e => setCatNameEdit(e.target.value)}
                                            className="flex-1 bg-transparent border-b border-black/20 focus:outline-none font-bold"
                                            autoFocus
                                        />
                                        <button onClick={() => handleUpdateCategory(cat)}><Check size={14} /></button>
                                        <button onClick={() => setEditingCatId(null)}><X size={14} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 font-bold uppercase tracking-wide text-xs">
                                        <GripVertical size={14} className="opacity-30" />
                                        {cat.label}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingCatId(cat.id); setCatNameEdit(cat.label); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Edit2 size={12} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-500">
                                        <Trash2 size={12} />
                                    </button>
                                    <ChevronRight size={16} className={`transition-transform ${selectedCategory?.id === cat.id ? 'translate-x-1' : 'opacity-50'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subcategories Column */}
                <div className="w-1/2 flex flex-col bg-black/5">
                    <div className="p-6 border-b border-inherit flex justify-between items-center bg-inherit">
                        <h2 className="font-black text-xl uppercase tracking-tight">
                            {selectedCategory ? `Sub: ${selectedCategory.label}` : 'Selecione uma Categoria'}
                        </h2>
                        {selectedCategory && (
                            <button onClick={handleAddSubcategory} className="p-2 bg-yellow-400 text-black rounded-full hover:scale-110 transition-transform">
                                <Plus size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {!selectedCategory ? (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                Selecione uma categoria para gerenciar subcategorias
                            </div>
                        ) : subcategories.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                Nenhuma subcategoria criada
                            </div>
                        ) : (
                            subcategories.map(sub => (
                                <div key={sub.id} className={`group flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} shadow-sm`}>
                                    {editingSubId === sub.id ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                value={subNameEdit}
                                                onChange={e => setSubNameEdit(e.target.value)}
                                                className="flex-1 bg-transparent border-b border-gray-500 focus:outline-none font-medium text-sm"
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdateSubcategory(sub)}><Check size={14} /></button>
                                            <button onClick={() => setEditingSubId(null)}><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 font-medium text-xs">
                                            <GripVertical size={14} className="opacity-30" />
                                            {sub.label}
                                        </div>
                                    )}

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingSubId(sub.id); setSubNameEdit(sub.label); }} className="p-1 hover:text-yellow-500">
                                            <Edit2 size={12} />
                                        </button>
                                        <button onClick={() => handleDeleteSubcategory(sub.id)} className="p-1 hover:text-red-500">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
