
import React, { useRef, useState } from 'react';
import { Project, Attachment } from '../types';
import { FileText, Image, FileSpreadsheet, File, Folder, Download, MoreVertical, HardDrive, UploadCloud, Plus, Presentation, ChevronDown, ExternalLink, Box, Eye, Cuboid, FolderPlus, Home, ChevronRight, ArrowLeft } from 'lucide-react';
import { File3DViewer } from './File3DViewer';

interface ProjectFilesProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export const ProjectFiles: React.FC<ProjectFilesProps> = ({ project, onUpdateProject }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [active3DFile, setActive3DFile] = useState<Attachment | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      
      let type: Attachment['type'] = 'other';
      // Detect 3D Types
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['stl', 'obj', 'step', 'stp', 'sldprt', 'sldasm'].includes(ext || '')) {
          type = 'other'; 
      } else if (file.type.includes('image')) type = 'image';
      else if (file.type.includes('pdf')) type = 'pdf';
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) type = 'sheet';

      addFile(file.name, type, `${(file.size / 1024 / 1024).toFixed(2)} MB`, objectUrl);
      
      // Auto-select if it's a 3D file
      if (['stl', 'obj', 'step', 'stp', 'sldprt', 'sldasm'].includes(ext || '')) {
          const newFile = {
            id: `f-${Date.now()}`,
            name: file.name,
            url: objectUrl,
            type: type,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            uploadedAt: new Date().toISOString(),
            owner: 'Me',
            parentId: currentFolderId || undefined
          };
          setActive3DFile(newFile);
      }
    }
  };

  const createSimulatedFile = (type: 'doc' | 'sheet' | 'slide') => {
    const names = {
        'doc': 'Untitled Document',
        'sheet': 'Untitled Spreadsheet',
        'slide': 'Untitled Presentation'
    };
    // Direct Google Workspace Creation Links
    const urls = {
        'doc': 'https://docs.google.com/document/create',
        'sheet': 'https://docs.google.com/spreadsheets/create',
        'slide': 'https://docs.google.com/presentation/create'
    }
    
    window.open(urls[type], '_blank');
    addFile(names[type], type, '0 KB', urls[type]);
    setIsNewMenuOpen(false);
  };

  const createFolder = () => {
      const name = prompt("Folder Name:");
      if (name) {
          addFile(name, 'folder', '-', '#');
      }
      setIsNewMenuOpen(false);
  };

  const addFile = (name: string, type: Attachment['type'], size: string, url: string) => {
    const newFile: Attachment = {
        id: `f-${Date.now()}`,
        name: name,
        url: url,
        type: type,
        size: size,
        uploadedAt: new Date().toISOString(),
        owner: 'Me',
        parentId: currentFolderId || undefined
    };

    onUpdateProject({
        ...project,
        files: [...(project.files || []), newFile]
    });
  };

  const getIcon = (file: Attachment) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    // Check for 3D extensions first
    if (['stl', 'obj', 'step', 'stp', 'sldprt', 'sldasm'].includes(ext || '')) {
        return <Box size={24} className="text-nexus-primary" />;
    }

    switch (file.type) {
      case 'image': return <Image size={24} className="text-purple-500" />;
      case 'pdf': return <FileText size={24} className="text-red-500" />;
      case 'sheet': return <FileSpreadsheet size={24} className="text-green-500" />;
      case 'doc': return <FileText size={24} className="text-blue-500" />;
      case 'slide': return <Presentation size={24} className="text-orange-500" />;
      case 'folder': return <Folder size={24} className="text-gray-500 fill-gray-100" />;
      default: return <File size={24} className="text-blue-500" />;
    }
  };

  const handleFileClick = (e: React.MouseEvent, file: Attachment) => {
      e.preventDefault();
      
      if (file.type === 'folder') {
          setCurrentFolderId(file.id);
          return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase();
      // Check if it is a 3D file
      if (['stl', 'obj', 'step', 'stp', 'sldprt', 'sldasm'].includes(ext || '')) {
          setActive3DFile(file);
          // Scroll to bottom to see preview
          setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
      } else {
          // Default behavior for other files
          window.open(file.url, '_blank');
      }
  };

  // Filter files for current directory
  const currentFiles = project.files?.filter(f => {
      if (currentFolderId) return f.parentId === currentFolderId;
      return !f.parentId; 
  }) || [];

  const getBreadcrumbs = () => {
      const crumbs = [];
      let currId = currentFolderId;
      while (currId) {
          const folder = project.files?.find(f => f.id === currId);
          if (folder) {
              crumbs.unshift(folder);
              currId = folder.parentId || null;
          } else {
              currId = null;
          }
      }
      return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900" onClick={() => setIsNewMenuOpen(false)}>
      {/* Drive Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 sticky top-0 z-20">
        <div>
           <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
             <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-6 h-6" alt="Drive" />
             Project Files
           </h2>
           <p className="text-sm text-gray-500">Connected to Google Drive / {project.name}</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => window.open(project.driveLink || 'https://drive.google.com', '_blank')}
             className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
           >
             <HardDrive size={16} /> Open in Drive <ExternalLink size={12}/>
           </button>
           
           <div className="relative">
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsNewMenuOpen(!isNewMenuOpen); }}
                 className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md rounded-[24px] text-sm font-medium text-gray-700 transition-all shadow-sm"
               >
                 <span className="text-2xl font-light text-google-red leading-none mb-0.5">+</span> <span className="font-medium">New</span>
               </button>

               {isNewMenuOpen && (
                   <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                       <button onClick={() => createFolder()} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700">
                           <FolderPlus size={18} className="text-gray-500"/> New Folder
                       </button>
                       <div className="border-t border-gray-100 my-1"></div>
                       <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700">
                           <UploadCloud size={18} className="text-gray-500"/> File upload
                       </button>
                       <div className="border-t border-gray-100 my-1"></div>
                       <button onClick={() => createSimulatedFile('doc')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700">
                           <FileText size={18} className="text-blue-500"/> Google Docs
                       </button>
                       <button onClick={() => createSimulatedFile('sheet')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700">
                           <FileSpreadsheet size={18} className="text-green-500"/> Google Sheets
                       </button>
                       <button onClick={() => createSimulatedFile('slide')} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700">
                           <Presentation size={18} className="text-orange-500"/> Google Slides
                       </button>
                   </div>
               )}
           </div>
           
           {/* Update Accept Attribute for CAD */}
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
             className="hidden" 
             accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.stl,.obj,.step,.stp,.sldprt,.sldasm"
           />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="p-6 space-y-8">
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <button 
                    onClick={() => setCurrentFolderId(null)} 
                    className={`flex items-center gap-1 hover:bg-gray-200 px-2 py-1 rounded transition-colors ${!currentFolderId ? 'font-bold text-gray-900' : ''}`}
                >
                    <Home size={14} /> Home
                </button>
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                        <ChevronRight size={14} className="text-gray-400" />
                        <button 
                            onClick={() => setCurrentFolderId(crumb.id)}
                            className={`hover:bg-gray-200 px-2 py-1 rounded transition-colors max-w-[150px] truncate ${index === breadcrumbs.length - 1 ? 'font-bold text-gray-900' : ''}`}
                        >
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* File Grid */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Files & Folders</h3>
                
                {currentFiles.length > 0 || currentFolderId ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    
                    {currentFolderId && (
                        <div 
                            onClick={() => {
                                const parent = project.files?.find(f => f.id === currentFolderId)?.parentId;
                                setCurrentFolderId(parent || null);
                            }}
                            className="group bg-gray-100 border border-transparent hover:border-gray-300 hover:bg-gray-200 rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-center items-center h-40 gap-2"
                        >
                            <ArrowLeft size={24} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-600">Back</span>
                        </div>
                    )}

                    {currentFiles.map(file => {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    const is3D = ['stl', 'obj', 'step', 'stp', 'sldprt', 'sldasm'].includes(ext || '');
                    const isActive = active3DFile?.id === file.id;
                    
                    return (
                    <a 
                        key={file.id} 
                        href={file.type === 'folder' ? undefined : file.url} 
                        onClick={(e) => handleFileClick(e, file)}
                        className={`group bg-white dark:bg-gray-800 border rounded-xl p-4 hover:shadow-card transition-all cursor-pointer flex flex-col justify-between h-40 relative block
                            ${isActive ? 'border-nexus-primary ring-2 ring-nexus-primary/20 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-nexus-primary/50'}
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl relative">
                                {getIcon(file)}
                                {is3D && (
                                    <div className="absolute -top-1 -right-1 bg-nexus-primary text-white text-[8px] px-1 rounded-full font-bold">3D</div>
                                )}
                            </div>
                            <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded-full">
                                <MoreVertical size={16} />
                            </button>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate" title={file.name}>{file.name}</h3>
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded-full bg-nexus-purple text-white flex items-center justify-center text-[8px] font-bold">ME</div>
                                    <span className="text-[10px] text-gray-400">Me</span>
                                </div>
                                <span className="text-[10px] text-gray-400">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        {is3D && !isActive && (
                            <div className="absolute inset-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                <span className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm flex items-center gap-1">
                                    <Eye size={12}/> Preview
                                </span>
                            </div>
                        )}
                        {isActive && (
                            <div className="absolute inset-0 bg-nexus-primary/5 rounded-xl pointer-events-none"></div>
                        )}
                    </a>
                    )})}
                    
                    {/* Add New Placeholder */}
                    <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-nexus-primary hover:border-nexus-primary hover:bg-nexus-primary/5 transition-all cursor-pointer h-40"
                    >
                        <Plus size={24} />
                        <span className="text-sm font-medium">Add File</span>
                    </div>
                </div>
                ) : (
                <div className="h-full flex flex-col items-center justify-center text-center pb-20 pt-10">
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-16 h-16 opacity-50 grayscale" alt="Drive" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Folder is Empty</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2 mb-8">
                        Upload files or create documents to get started.
                    </p>
                    <button 
                    onClick={() => setIsNewMenuOpen(true)}
                    className="px-6 py-3 bg-nexus-primary text-white rounded-lg font-medium hover:bg-indigo-600 shadow-md transition-all"
                    >
                    Create or Upload
                    </button>
                </div>
                )}
            </div>

            {/* 3D Preview Stage (Moved to Bottom) */}
            {active3DFile && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 pt-8 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Cuboid size={20} className="text-nexus-primary" />
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">3D Model Preview</h3>
                    </div>
                    <div className="w-full h-[600px]">
                        <File3DViewer 
                            file={active3DFile} 
                            isOpen={true} 
                            onClose={() => setActive3DFile(null)}
                            isEmbedded={true}
                        />
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
