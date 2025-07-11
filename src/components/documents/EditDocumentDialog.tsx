import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, FileText } from 'lucide-react';
import { useDocuments, DocumentData } from '@/hooks/useDocuments';
import { useToast } from '@/hooks/use-toast';
import { useDocumentCodeConfig } from '@/hooks/useDocumentCodeConfig';
import { mapDocumentTypeCodeToDocumentTypeEnum } from '@/shared/utils';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAuth } from '@/contexts/AuthContext';

// Import new modular sections
import { DocumentMetadataForm } from './edit-dialog-sections/DocumentMetadataForm';
import { DocumentCodePreviewSection } from './edit-dialog-sections/DocumentCodePreviewSection';
import { DocumentContentSection } from './edit-dialog-sections/DocumentContentSection';
import { DocumentFileManagement } from './edit-dialog-sections/DocumentFileManagement';
import { DocumentTagsInput } from './edit-dialog-sections/DocumentTagsInput';

interface EditDocumentDialogProps {
  document: DocumentData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditDocumentDialog: React.FC<EditDocumentDialogProps> = ({ document, open, onOpenChange }) => {
  const { user } = useAuth();
  const { updateDocument, isUpdating } = useDocuments();
  const { config: codeConfig, isLoading: isLoadingCodeConfig } = useDocumentCodeConfig();
  const { uploadFile, deleteFile, uploading: isUploadingFile } = useFileUpload();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    company_code: '',
    airport: undefined as string | undefined, // Use string for Airport type in form state
    department_code: undefined as string | undefined,
    sub_department_code: undefined as string | undefined,
    document_type_code: undefined as string | undefined,
    language_code: undefined as string | undefined,
    sequence_number: '',
    version: '',
    description: '',
    content: '',
    tags: [] as string[],
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title || '',
        company_code: document.company_code || 'TAVTUN',
        airport: document.airport || undefined,
        department_code: document.department_code || undefined,
        sub_department_code: document.sub_department_code || undefined,
        document_type_code: document.document_type_code || undefined,
        language_code: document.language_code || undefined,
        sequence_number: document.sequence_number?.toString() || '',
        version: `REV:${document.version || 0}`,
        description: document.content || '',
        content: document.content || '',
        tags: document.tags || [],
      });
      if (document.file_path) {
        // Set initial preview URL if document has a file
        // Note: getAbsoluteFilePath is imported in utils, but needs to be passed down or re-imported if used directly in sub-components
        setPreviewUrl(document.file_path); // Store relative path, absolute path generated in DocumentFileManagement
      } else {
        setPreviewUrl(null);
      }
      setSelectedFile(null);
    }
  }, [document]);

  const previewQrCodeEdit = useMemo(() => {
    const seqNum = formData.sequence_number.padStart(3, '0');
    // This utility function needs to be aware of the full path construction
    // For now, it generates a preview string based on form data
    const company = formData.company_code || 'COMP';
    const scope = formData.airport || 'SCOPE';
    const dept = formData.department_code || 'DEPT';
    const subDept = formData.sub_department_code ? `-${formData.sub_department_code}` : '';
    const docType = formData.document_type_code || 'TYPE';
    const lang = formData.language_code || 'LANG';
    return `${company}-${scope}-${dept}${subDept}-${docType}-${seqNum}-${lang}`;
  }, [
    formData.company_code,
    formData.airport,
    formData.department_code,
    formData.sub_department_code,
    formData.document_type_code,
    formData.language_code,
    formData.sequence_number
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const removeFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) { // Only revoke if it's a blob URL
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!document) return;

    if (!formData.title.trim() || !formData.airport || !formData.document_type_code || !formData.department_code || !formData.language_code || !formData.sequence_number.trim()) {
      toast({
        title: 'Champs manquants',
        description: 'Veuillez remplir tous les champs obligatoires (Titre, Aéroport, Type de document, Département, Langue, Numéro de document).',
        variant: 'destructive',
      });
      return;
    }

    let finalFilePath: string | undefined = document.file_path;
    let finalFileType: string | undefined = document.file_type;
    let newVersion = document.version;

    if (selectedFile) {
      const documentTypeEnum = mapDocumentTypeCodeToDocumentTypeEnum(formData.document_type_code!);

      const uploaded = await uploadFile(selectedFile, {
        documentType: documentTypeEnum,
        scopeCode: formData.airport,
        departmentCode: formData.department_code,
        documentTypeCode: formData.document_type_code,
        allowedTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
        maxSize: 10
      });
      if (uploaded) {
        if (document.file_path) {
          const oldFileDeleted = await deleteFile(document.file_path);
          if (!oldFileDeleted) {
            console.warn(`Failed to delete old file: ${document.file_path}. Proceeding with document update.`);
          }
        }
        finalFilePath = uploaded.path;
        finalFileType = selectedFile.type;
        newVersion = (document.version || 0) + 1;
      } else {
        return;
      }
    }

    const updatedData = {
      title: formData.title,
      content: formData.content,
      airport: formData.airport,
      company_code: formData.company_code,
      scope_code: codeConfig?.scopes.find(s => s.code === formData.airport)?.code || formData.airport,
      department_code: formData.department_code,
      sub_department_code: formData.sub_department_code || undefined,
      document_type_code: formData.document_type_code,
      language_code: formData.language_code,
      sequence_number: parseInt(formData.sequence_number),
      version: newVersion,
      tags: formData.tags,
      file_path: finalFilePath,
      file_type: finalFileType,
    };

    updateDocument({ id: document.id, ...updatedData }, {
      onSuccess: () => {
        onOpenChange(false);
        toast({
          title: 'Document mis à jour',
          description: 'Le document a été mis à jour avec succès.',
        });
      }
    });
  };

  if (isLoadingCodeConfig) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-aviation-sky"></div>
            <p className="ml-4 text-gray-600">Chargement de la configuration...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const initialDepartmentCode = useMemo(() => {
    if (user && codeConfig?.departments) {
      const foundDept = codeConfig.departments.find(d => d.label === user.department);
      return foundDept ? foundDept.code : undefined;
    }
    return undefined;
  }, [user, codeConfig]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Modifier le Document
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DocumentMetadataForm
            formData={formData}
            setFormData={setFormData}
            user={user}
            initialDepartmentCode={initialDepartmentCode}
          />

          <DocumentCodePreviewSection
            document={document}
            previewQrCodeEdit={previewQrCodeEdit}
          />

          <DocumentContentSection
            formData={formData}
            setFormData={setFormData}
          />

          <DocumentFileManagement
            document={document}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
          />

          <DocumentTagsInput
            formData={formData}
            setFormData={setFormData}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating || isUploadingFile}>
              <Save className="w-4 h-4 mr-2" />
              {isUpdating || isUploadingFile ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};