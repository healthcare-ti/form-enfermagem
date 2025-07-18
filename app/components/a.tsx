"use client"
import { useState, useEffect, useRef, ChangeEvent, FocusEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Image from "next/image";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the maximum submission date
const MAX_SUBMISSION_DATE = new Date("2025-07-11T12:00:00");

// Type definitions for form state
interface FormData {
  nome: string;
  sexo: string;
  conselho: string;
  tipoProfissional: string;
  documentoNadaConsta: File | null;
  documentoResidencia: File | null;
  banco: string;
  agencia: string;
  conta: string;
  digito: string;
  pix: string;
  pixType: string;
  enderecoRua: string;
  enderecoNumero: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoComplemento: string;
  cep: string;
  estadoCivil: string;
  anexoEstadoCivil: File | null;
  cadernetaVacina: File | null;
  certificadoReservista: File | null;
  foto: File | null;
  email: string;
  celular: string;
  celular2: string;
  termoPrivacidade: boolean;
}

// Type definitions for validation errors
type ValidationErrors = {
  [key in keyof FormData]?: string;
} & {
  pixType?: string; // Add pixType as it can also have an error
};

// Type definitions for touched fields
type TouchedFields = {
  [key in keyof FormData]?: boolean;
};

// Type definitions for status messages
interface StatusMessage {
  message: string;
  type: "success" | "error" | "";
}

// Modal component for messages
interface MessageModalProps {
  message: string;
  type: "success" | "error" | "";
  onClose: () => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({ message, type, onClose }) => {
  if (!message) return null;

  const alertVariant = type === "success" ? "default" : "destructive";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-sm w-full p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800">
        <CardContent className="flex flex-col items-center space-y-4">
          <Alert variant={alertVariant} className="w-full">
            <AlertTitle>{type === "success" ? "Sucesso!" : "Erro!"}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default function CadastroTecnicoForm() {
  // Ref for the anexoEstadoCivil file input to clear its value visually
  const anexoEstadoCivilRef = useRef<HTMLInputElement>(null);
  // Ref for the PIX input to clear its value visually
  const pixInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState<FormData>({
    nome: "",
    sexo: "",
    conselho: "",
    tipoProfissional: "",
    documentoNadaConsta: null,
    documentoResidencia: null,
    banco: "",
    agencia: "",
    conta: "",
    digito: "",
    pix: "",
    pixType: "",
    enderecoRua: "",
    enderecoNumero: "",
    enderecoBairro: "",
    enderecoCidade: "",
    enderecoComplemento: "",
    cep: "",
    estadoCivil: "",
    anexoEstadoCivil: null,
    cadernetaVacina: null,
    certificadoReservista: null,
    foto: null,
    email: "",
    celular: "",
    celular2: "",
    termoPrivacidade: false,
  });

  // UI states
  const [statusMessage, setStatusMessage] = useState<StatusMessage>({ message: "", type: "" }); // Unified status message
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<StatusMessage>({ message: "", type: "" });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = MAX_SUBMISSION_DATE.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("Encerrado");
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Function to format COREN number (XX.XXX.XXX-X)
  const formatCoren = (value: string): string => {
    if (!value) return value;
    let digits = value.replace(/\D/g, '');
    if (digits.length > 2) {
      digits = digits.substring(0, 2) + '.' + digits.substring(2);
    }
    if (digits.length > 6) {
      digits = digits.substring(0, 6) + '.' + digits.substring(6);
    }
    if (digits.length > 10) {
      digits = digits.substring(0, 10) + '-' + digits.substring(10);
    }
    return digits.substring(0, 12);
  };

  // Function to format CEP (XXXXX-XXX)
  const formatCep = (value: string): string => {
    if (!value) return value;
    let digits = value.replace(/\D/g, '');
    if (digits.length > 5) {
      digits = digits.substring(0, 5) + '-' + digits.substring(5);
    }
    return digits.substring(0, 9);
  };

  // Function to format CPF (XXX.XXX.XXX-XX)
  const formatCpf = (value: string): string => {
    if (!value) return value;
    let digits = value.replace(/\D/g, '');
    if (digits.length > 3) {
      digits = digits.substring(0, 3) + '.' + digits.substring(3);
    }
    if (digits.length > 7) {
      digits = digits.substring(0, 7) + '.' + digits.substring(7);
    }
    if (digits.length > 11) {
      digits = digits.substring(0, 11) + '-' + digits.substring(11);
    }
    return digits.substring(0, 14);
  };

  // Function to format CNPJ (XX.XXX.XXX/XXXX-XX)
  const formatCnpj = (value: string): string => {
    if (!value) return value;
    let digits = value.replace(/\D/g, '');
    if (digits.length > 2) {
      digits = digits.substring(0, 2) + '.' + digits.substring(2);
    }
    if (digits.length > 6) {
      digits = digits.substring(0, 6) + '.' + digits.substring(6);
    }
    if (digits.length > 10) {
      digits = digits.substring(0, 10) + '/' + digits.substring(10);
    }
    if (digits.length > 15) {
      digits = digits.substring(0, 15) + '-' + digits.substring(15);
    }
    return digits.substring(0, 18);
  };

  // Function to format Brazilian Cellphone (XX) X XXXX-XXXX
  const formatCelular = (value: string, prevValue?: string): string => {
    let cleanedValue = value.replace(/\D/g, ''); // Get only digits from current input

    // Heuristic for backspace: if current cleaned length is same as previous, but raw length decreased,
    // it implies a mask char was deleted, so remove one more digit from cleanedValue.
    if (prevValue !== undefined) {
      const prevCleanedValue = prevValue.replace(/\D/g, '');
      if (value.length < prevValue.length && cleanedValue.length === prevCleanedValue.length && cleanedValue.length > 0) {
        cleanedValue = cleanedValue.slice(0, -1);
      }
    }

    let formattedValue = '';
    if (cleanedValue.length > 0) {
      formattedValue = `(${cleanedValue.substring(0, 2)}`;
    }
    if (cleanedValue.length > 2) {
      formattedValue += `) ${cleanedValue.substring(2, 3)}`; // First digit after DDD (e.g., '9' for 9XXXX-XXXX)
    }
    if (cleanedValue.length > 3) {
      formattedValue += ` ${cleanedValue.substring(3, 7)}`;
    }
    if (cleanedValue.length > 7) {
      formattedValue += `-${cleanedValue.substring(7, 11)}`;
    }
    return formattedValue.substring(0, 16); // Max length for (XX) X XXXX-XXXX
  };


  // Function to format Random PIX Key (UUID format)
  const formatRandomPix = (value: string): string => {
    if (!value) return value;
    const cleaned = value.replace(/[^0-9a-fA-F]/g, ''); // Allow hex characters
    let formatted = cleaned;
    if (formatted.length > 8) {
      formatted = formatted.substring(0, 8) + '-' + formatted.substring(8);
    }
    if (formatted.length > 13) {
      formatted = formatted.substring(0, 13) + '-' + formatted.substring(13);
    }
    if (formatted.length > 18) {
      formatted = formatted.substring(0, 18) + '-' + formatted.substring(18);
    }
    if (formatted.length > 23) {
      formatted = formatted.substring(0, 23) + '-' + formatted.substring(23);
    }
    return formatted.substring(0, 36 + 4); // UUID length + 4 hyphens
  };


  // Centralized validation logic
  const validateForm = (currentForm: FormData): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Required text/select fields
    const requiredFields: Array<keyof FormData> = [
      "nome", "sexo", "conselho", "tipoProfissional", "banco", "agencia",
      "conta", "digito", "pixType", "enderecoRua", "enderecoNumero", "enderecoBairro",
      "enderecoCidade", "cep", "celular", "estadoCivil", "email"
    ];
    requiredFields.forEach(field => {
      if (!currentForm[field]) {
        errors[field] = "Este campo é obrigatório.";
      }
    });

    // Email validation (optional but if filled, must be valid format)
    if (currentForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentForm.email)) {
      errors.email = "Formato de email inválido.";
    }

    // COREN length validation (9 digits after removing non-digits)
    if (currentForm.conselho && currentForm.conselho.replace(/\D/g, '').length !== 9) {
      errors.conselho = "Número do Conselho inválido (esperado 9 dígitos).";
    }

    // CEP length validation (8 digits after removing non-digits)
    if (currentForm.cep && currentForm.cep.replace(/\D/g, '').length !== 8) {
      errors.cep = "CEP inválido (esperado 8 dígitos).";
    }

    // Celular length validation (exactly 11 digits after removing non-digits for the new format)
    const celularClean = currentForm.celular.replace(/\D/g, '');
    if (celularClean.length !== 11) {
      errors.celular = "Celular inválido (esperado 11 dígitos para o formato (XX) X XXXX-XXXX).";
    }
    const celular2Clean = currentForm.celular2.replace(/\D/g, '');
    if (currentForm.celular2 && celular2Clean.length !== 11) {
      errors.celular2 = "Celular opcional inválido (esperado 11 dígitos para o formato (XX) X XXXX-XXXX).";
    }


    // PIX key validation based on type
    const pixValueClean = currentForm.pix.replace(/\D/g, ''); // Clean for numeric checks
    if (currentForm.pixType) { // Only validate if a PIX type is selected
      switch (currentForm.pixType) {
        case "cpf":
          if (pixValueClean.length !== 11) {
            errors.pix = "CPF inválido (esperado 11 dígitos).";
          }
          break;
        case "cnpj":
          if (pixValueClean.length !== 14) {
            errors.pix = "CNPJ inválido (esperado 14 dígitos).";
          }
          break;
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentForm.pix)) {
            errors.pix = "Formato de email inválido.";
          }
          break;
        case "celular":
          if (pixValueClean.length < 10 || pixValueClean.length > 11) { // Brazilian phone numbers 10 or 11 digits
            errors.pix = "Número de celular inválido (esperado 10 ou 11 dígitos).";
          }
          break;
        case "aleatoria":
          // UUID format: 8-4-4-4-12 hex characters
          if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(currentForm.pix)) {
            errors.pix = "Chave aleatória inválida (formato UUID).";
          }
          break;
        default:
          break;
      }
    } else if (currentForm.pix) { // If pix has a value but no type is selected
      errors.pixType = "Por favor, selecione o tipo de chave PIX.";
    }


    // Conditional file input validation
    if (!currentForm.documentoNadaConsta) {
      errors.documentoNadaConsta = "Documento Nada Consta é obrigatório.";
    }
    if (!currentForm.documentoResidencia) {
      errors.documentoResidencia = "Comprovante de Residência é obrigatório.";
    }
    if (!currentForm.cadernetaVacina) {
      errors.cadernetaVacina = "Caderneta de Vacinação é obrigatória.";
    }
    if (!currentForm.foto) {
      errors.foto = "Foto é obrigatória.";
    }

    // anexoEstadoCivil is required only if estadoCivil is not "solteiro"
    if (currentForm.estadoCivil && currentForm.estadoCivil !== "solteiro" && !currentForm.anexoEstadoCivil) {
      errors.anexoEstadoCivil = "Anexo Estado Civil é obrigatório para o seu estado civil.";
    }

    // certificadoReservista is required only if sexo is "homem"
    if (currentForm.sexo === "homem" && !currentForm.certificadoReservista) {
      errors.certificadoReservista = "Certificado de Reservista é obrigatório para homens.";
    }

    if (!currentForm.termoPrivacidade) {
      errors.termoPrivacidade = "É necessário declarar que as informações são verdadeiras.";
    }

    return errors;
  };

  // Handle form input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | boolean | File | null;

    if (type === "checkbox") {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === "file") {
      const files = (e.target as HTMLInputElement).files;
      processedValue = files && files.length > 0 ? files[0] : null;
    } else {
      processedValue = value;
    }

    setForm((prev: FormData) => {
      let updatedForm = { ...prev };

      if (name === "celular" || name === "celular2") {
        processedValue = formatCelular(value, prev[name as keyof FormData] as string);
        updatedForm = { ...updatedForm, [name]: processedValue };
      } else if (name === "pix") {
        switch (updatedForm.pixType) {
          case "cpf":
            processedValue = formatCpf(value);
            break;
          case "cnpj":
            processedValue = formatCnpj(value);
            break;
          case "celular":
            processedValue = formatCelular(value, updatedForm.pix);
            break;
          case "aleatoria":
            processedValue = formatRandomPix(value);
            break;
          default:
            break;
        }
        updatedForm = { ...updatedForm, [name as keyof FormData]: processedValue };
      } else if (name === "enderecoNumero" || name === "agencia" || name === "conta" || name === "digito") {
        processedValue = value.replace(/\D/g, '');
        updatedForm = { ...updatedForm, [name]: processedValue };
      } else if (name === "pixType") {
        updatedForm.pix = "";
        if (pixInputRef.current) {
          pixInputRef.current.value = "";
        }
        updatedForm = { ...updatedForm, [name as keyof FormData]: processedValue };
      } else {
        updatedForm = { ...updatedForm, [name]: processedValue };
      }

      if (name === "estadoCivil" && processedValue === "solteiro") {
        updatedForm.anexoEstadoCivil = null;
        if (anexoEstadoCivilRef.current) {
          anexoEstadoCivilRef.current.value = '';
        }
      }

      if (isSubmitted) {
        setValidationErrors(validateForm(updatedForm));
      }
      return updatedForm;
    });

    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Handle blur event for validation on loss of focus
  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (isSubmitted) {
      setValidationErrors(validateForm(form));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitted(true);
    setIsSubmitting(true);

    // Mark all fields as touched to show validation errors for all empty required fields
    const allFormFields = Object.keys(form).reduce((acc, key) => {
      acc[key as keyof FormData] = true;
      return acc;
    }, {} as TouchedFields);
    setTouched(allFormFields);

    const errors = validateForm(form);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStatusMessage({ message: "Por favor, corrija os erros no formulário antes de enviar.", type: "error" });
      setIsSubmitting(false);
      return;
    }

    const now = new Date();
    if (now > MAX_SUBMISSION_DATE) {
      setStatusMessage({ message: "O prazo para envio foi encerrado.", type: "error" });
      setIsSubmitting(false);
      return;
    }

    setStatusMessage({ message: "", type: "" });
    const SUPABASE_STORAGE_BUCKET = 'solicitacoes-files';

    let submissionId: number | null = null;
    const successfullyUploadedPaths: string[] = []; // Track paths for file rollback

    try {
      // --- 1. Prepare and insert data to get an ID ---
      const initialDataToInsert = {
        nome: form.nome,
        sexo: form.sexo,
        conselho: form.conselho,
        tipo_profissional: form.tipoProfissional,
        banco: form.banco,
        agencia: form.agencia,
        conta: form.conta,
        digito: form.digito,
        pix: form.pix,
        pix_type: form.pixType,
        endereco_rua: form.enderecoRua,
        endereco_numero: form.enderecoNumero,
        endereco_bairro: form.enderecoBairro,
        endereco_cidade: form.enderecoCidade,
        endereco_complemento: form.enderecoComplemento,
        cep: form.cep,
        estado_civil: form.estadoCivil,
        email: form.email,
        celular: form.celular,
        celular2: form.celular2 || null,
        termo_privacidade: form.termoPrivacidade,
      };

      const { data: submissionData, error: dbInsertError } = await supabase
        .from('solicitacoes_cadastro')
        .insert([initialDataToInsert])
        .select('id')
        .single();

      if (dbInsertError) {
        // --- ENHANCED ERROR HANDLING FOR UNIQUE KEY VIOLATION ---
        if (dbInsertError.code === '23505') { // Postgres code for unique_violation
          let field = "fornecido";
          // Try to identify which field caused the error from the constraint name in the message
          if (dbInsertError.message.toLowerCase().includes('email')) {
            field = "de e-mail";
          } else if (dbInsertError.message.toLowerCase().includes('conselho')) {
            field = "de número do conselho";
          }

          throw new Error(`O valor ${field} já está cadastrado em nosso sistema. Por favor, verifique os dados ou entre em contato com o suporte.`);
        }
        // For any other database error, throw a more generic message
        throw new Error(`Falha ao salvar o registro no banco de dados: ${dbInsertError.message}`);
      }

      if (!submissionData) {
        throw new Error('Não foi possível criar o registro no banco de dados após a inserção.');
      }

      submissionId = submissionData.id;

      // --- 2. Upload files and track success ---
      const fileUploads: { dbColumnName: string; file: File; folder: string }[] = [];
      if (form.documentoNadaConsta) fileUploads.push({ dbColumnName: 'documento_nada_consta', file: form.documentoNadaConsta, folder: 'documentos-nada-consta' });
      if (form.documentoResidencia) fileUploads.push({ dbColumnName: 'documento_residencia', file: form.documentoResidencia, folder: 'documentos-residencia' });
      if (form.anexoEstadoCivil) fileUploads.push({ dbColumnName: 'anexo_estado_civil', file: form.anexoEstadoCivil, folder: 'anexo-estado-civil' });
      if (form.cadernetaVacina) fileUploads.push({ dbColumnName: 'caderneta_vacina', file: form.cadernetaVacina, folder: 'caderneta-vacina' });
      if (form.certificadoReservista) fileUploads.push({ dbColumnName: 'certificado_reservista', file: form.certificadoReservista, folder: 'certificado-reservista' });
      if (form.foto) fileUploads.push({ dbColumnName: 'foto', file: form.foto, folder: 'fotos-perfil' });

      const uploadedFileDbPaths: { [key: string]: string } = {};

      for (const { dbColumnName, file, folder } of fileUploads) {
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `${folder}/${submissionId}/${uniqueFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          throw new Error(`Falha no upload do documento ${dbColumnName}. O envio foi cancelado.`);
        }

        successfullyUploadedPaths.push(filePath);
        uploadedFileDbPaths[dbColumnName] = uploadData.path;
      }

      // --- 3. Update the database record with file paths ---
      if (Object.keys(uploadedFileDbPaths).length > 0) {
        const { error: dbUpdateError } = await supabase
          .from('solicitacoes_cadastro')
          .update(uploadedFileDbPaths)
          .eq('id', submissionId);

        if (dbUpdateError) {
          throw new Error(`Falha ao salvar os caminhos dos arquivos: ${dbUpdateError.message}`);
        }
      }

      // --- 4. Success and Form Reset ---
      setStatusMessage({ message: "Formulário enviado com sucesso! 🎉", type: "success" });
      setModalMessage({ message: "Formulário enviado com sucesso!", type: "success" });

      setForm({
        nome: "", sexo: "", conselho: "", tipoProfissional: "",
        documentoNadaConsta: null, documentoResidencia: null, banco: "",
        agencia: "", conta: "", digito: "", pix: "", pixType: "", enderecoRua: "", enderecoNumero: "",
        enderecoBairro: "", enderecoCidade: "", enderecoComplemento: "",
        cep: "", estadoCivil: "", anexoEstadoCivil: null, cadernetaVacina: null,
        certificadoReservista: null, foto: null, email: "", celular: "", celular2: "",
        termoPrivacidade: false,
      });
      setValidationErrors({});
      setTouched({});
      setIsSubmitted(false);
      if (anexoEstadoCivilRef.current) anexoEstadoCivilRef.current.value = '';
      if (pixInputRef.current) pixInputRef.current.value = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Erro no processo de envio:", error.message);

      // --- FULL ROLLBACK LOGIC ---
      // 1. Rollback Files
      if (successfullyUploadedPaths.length > 0) {
        console.log('Iniciando rollback de arquivos:', successfullyUploadedPaths);
        const { error: removeError } = await supabase.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .remove(successfullyUploadedPaths);

        if (removeError) {
          console.error('FALHA NO ROLLBACK DE ARQUIVOS! Arquivos podem ter ficado órfãos no storage:', removeError.message);
        } else {
          console.log('Rollback de arquivos concluído com sucesso.');
        }
      }

      // 2. Rollback Database Row
      if (submissionId) {
        console.log(`Iniciando rollback do banco de dados para a submissão ID: ${submissionId}`);
        const { error: deleteError } = await supabase
          .from('solicitacoes_cadastro')
          .delete()
          .eq('id', submissionId);

        if (deleteError) {
          console.error(`FALHA CRÍTICA NO ROLLBACK! A submissão com ID ${submissionId} não pôde ser deletada. Erro:`, deleteError.message);
          const criticalErrorMsg = `Ocorreu um erro e a limpeza automática falhou. Por favor, contate o suporte.`;
          setStatusMessage({ message: criticalErrorMsg, type: "error" });
          setModalMessage({ message: criticalErrorMsg, type: "error" });
        } else {
          console.log(`Rollback do banco de dados para a submissão ID: ${submissionId} concluído.`);
          setStatusMessage({ message: error.message, type: "error" });
          setModalMessage({ message: error.message, type: "error" });
        }
      } else {
        // Error happened before DB insertion, just show the original error.
        setStatusMessage({ message: error.message, type: "error" });
        setModalMessage({ message: error.message, type: "error" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effect to update status message when validation errors change after first submission attempt
  useEffect(() => {
    if (isSubmitted) {
      if (Object.keys(validationErrors).length === 0) {
        setStatusMessage({ message: "É possível enviar o formulário!", type: "success" });
      } else {
        setStatusMessage({ message: "Por favor, corrija os erros no formulário antes de enviar.", type: "error" });
      }
    }
  }, [validationErrors, isSubmitted]);


  const closeModal = () => {
    setModalMessage({ message: "", type: "" });
  };

  // Determine if the submit button should be disabled
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-xl mx-auto p-6 space-y-6 w-full rounded-xl shadow-lg">
        <div style={{ position: 'relative', width: '100%', height: '100px', marginBottom:0 }}>
          <Image alt={""} src="/HEALTHCARE.png" objectFit="contain" fill/>
        </div>
        <CardContent className="space-y-6 px-0">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Cadastro de Profissionais de Enfermagem</h1>
          <div className="text-sm text-muted-foreground text-center">
            Tempo restante para envio: <span className="font-bold text-blue-600 dark:text-blue-400">{timeLeft}</span>
          </div>

          {/* {statusMessage.message && (
            <Alert variant={statusMessage.type === "success" ? "default" : "destructive"}>
              <AlertTitle>{statusMessage.type === "success" ? "Sucesso!" : "Erro!"}</AlertTitle>
              <AlertDescription>{statusMessage.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
             Dados Pessoais 
            <fieldset className="border border-gray-300 dark:border-gray-700 p-5 rounded-lg space-y-4">
              <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Dados Pessoais</legend>
              <div>
                <Label htmlFor="nome" className="mb-1 block">Nome completo</Label>
                <Input id="nome" name="nome" value={form.nome} onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                {touched.nome && validationErrors.nome && <p className="text-red-500 text-xs mt-1">{validationErrors.nome}</p>}
              </div>
              <div>
                <Label htmlFor="sexo" className="mb-1 block">Sexo</Label>
                <select id="sexo" name="sexo" value={form.sexo} onChange={handleChange} onBlur={handleBlur} className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="">Selecione</option>
                  <option value="homem">Homem</option>
                  <option value="mulher">Mulher</option>
                </select>
                {touched.sexo && validationErrors.sexo && <p className="text-red-500 text-xs mt-1">{validationErrors.sexo}</p>}
              </div>
              <div>
                <Label htmlFor="conselho" className="mb-1 block">Número do Conselho (COREN-RJ)</Label>
                <Input
                  id="conselho"
                  name="conselho"
                  value={form.conselho}
                  onInput={(e: ChangeEvent<HTMLInputElement>) => { e.target.value = formatCoren(e.target.value); handleChange(e); }}
                  onBlur={handleBlur}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: XX.XXX.XXX-X"
                />
                {touched.conselho && validationErrors.conselho && <p className="text-red-500 text-xs mt-1">{validationErrors.conselho}</p>}
              </div>
              <div>
                <Label htmlFor="tipoProfissional" className="mb-1 block">Tipo Profissional</Label>
                <div className="flex items-end space-x-2">
                  <select id="tipoProfissional" name="tipoProfissional" value={form.tipoProfissional} onChange={handleChange} onBlur={handleBlur} className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 dark:text-white">
                    <option value="">Selecione</option>
                    <option value="tecnico de enfermagem">Técnico de Enfermagem</option>
                    <option value="enfermeiro">Enfermeiro</option>
                  </select>
                </div>
                {touched.tipoProfissional && validationErrors.tipoProfissional && <p className="text-red-500 text-xs mt-1">{validationErrors.tipoProfissional}</p>}
              </div>
              <div>
                <Label htmlFor="estadoCivil" className="mb-1 block">Estado Civil</Label>
                <select id="estadoCivil" name="estadoCivil" value={form.estadoCivil} onChange={handleChange} onBlur={handleBlur} className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="">Selecione</option>
                  <option value="solteiro">Solteiro(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viuvo">Viúvo(a)</option>
                  <option value="uniao_estavel">União Estável</option>
                </select>
                {touched.estadoCivil && validationErrors.estadoCivil && <p className="text-red-500 text-xs mt-1">{validationErrors.estadoCivil}</p>}
              </div>
            </fieldset>

             Documentos
            <fieldset className="border border-gray-300 dark:border-gray-700 p-5 rounded-lg space-y-4">
              <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Documentos</legend>
              <div>
                <Label htmlFor="documentoNadaConsta" className="mb-1 block">Documento Nada Consta</Label>
                <Input id="documentoNadaConsta" type="file" name="documentoNadaConsta" onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {touched.documentoNadaConsta && validationErrors.documentoNadaConsta && <p className="text-red-500 text-xs mt-1">{validationErrors.documentoNadaConsta}</p>}
              </div>
              <div>
                <Label htmlFor="documentoResidencia" className="mb-1 block">Comprovante de Residência</Label>
                <Input id="documentoResidencia" type="file" name="documentoResidencia" onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {touched.documentoResidencia && validationErrors.documentoResidencia && <p className="text-red-500 text-xs mt-1">{validationErrors.documentoResidencia}</p>}
              </div>
              <div>
                <Label htmlFor="anexoEstadoCivil" className="mb-1 block">Anexo Estado Civil</Label>
                <Input
                  id="anexoEstadoCivil"
                  type="file"
                  name="anexoEstadoCivil"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={form.estadoCivil === "solteiro"} // Disable if solteiro
                  ref={anexoEstadoCivilRef} // Attach ref here
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {form.estadoCivil === "solteiro" && <p className="text-xs text-gray-500 mt-1">Não é necessário para Solteiro(a).</p>}
                {touched.anexoEstadoCivil && validationErrors.anexoEstadoCivil && <p className="text-red-500 text-xs mt-1">{validationErrors.anexoEstadoCivil}</p>}
              </div>
              <div>
                <Label htmlFor="cadernetaVacina" className="mb-1 block">Caderneta de Vacinação</Label>
                <Input id="cadernetaVacina" type="file" name="cadernetaVacina" onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {touched.cadernetaVacina && validationErrors.cadernetaVacina && <p className="text-red-500 text-xs mt-1">{validationErrors.cadernetaVacina}</p>}
              </div>
              <div>
                <Label htmlFor="certificadoReservista" className="mb-1 block">Certificado de Reservista</Label>
                <Input id="certificadoReservista" type="file" name="certificadoReservista" onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {form.sexo === "mulher" && <p className="text-xs text-gray-500 mt-1">Não é necessário para Mulher.</p>}
                {touched.certificadoReservista && validationErrors.certificadoReservista && <p className="text-red-500 text-xs mt-1">{validationErrors.certificadoReservista}</p>}
              </div>
              <div>
                <Label htmlFor="foto" className="mb-1 block">Foto</Label>
                <Input id="foto" type="file" name="foto" onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {touched.foto && validationErrors.foto && <p className="text-red-500 text-xs mt-1">{validationErrors.foto}</p>}
              </div>
            </fieldset>

             Dados Bancários 
            <fieldset className="border border-gray-300 dark:border-gray-700 p-5 rounded-lg space-y-4">
              <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Dados Bancários</legend>
              <div>
                <Label htmlFor="banco" className="mb-1 block">Banco</Label>
                <Input id="banco" name="banco" value={form.banco} onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                {touched.banco && validationErrors.banco && <p className="text-red-500 text-xs mt-1">{validationErrors.banco}</p>}
              </div>
              <div>
                <Label htmlFor="agencia" className="mb-1 block">Agência</Label>
                <Input
                  id="agencia"
                  name="agencia"
                  value={form.agencia}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Apenas números"
                />
                {touched.agencia && validationErrors.agencia && <p className="text-red-500 text-xs mt-1">{validationErrors.agencia}</p>}
              </div>
              <div>
                <Label htmlFor="conta" className="mb-1 block">Conta</Label>
                <Input
                  id="conta"
                  name="conta"
                  value={form.conta}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Apenas números"
                />
                {touched.conta && validationErrors.conta && <p className="text-red-500 text-xs mt-1">{validationErrors.conta}</p>}
              </div>
              <div>
                <Label htmlFor="digito" className="mb-1 block">Dígito</Label>
                <Input
                  id="digito"
                  name="digito"
                  value={form.digito}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Apenas números"
                />
                {touched.digito && validationErrors.digito && <p className="text-red-500 text-xs mt-1">{validationErrors.digito}</p>}
              </div>
              <div>
                <Label htmlFor="pixType" className="mb-1 block">Tipo de Chave Pix</Label>
                <select id="pixType" name="pixType" value={form.pixType} onChange={handleChange} onBlur={handleBlur} className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 dark:text-white">
                  <option value="">Selecione o tipo</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">Email</option>
                  <option value="celular">Celular</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
                {touched.pixType && validationErrors.pixType && <p className="text-red-500 text-xs mt-1">{validationErrors.pixType}</p>}
              </div>
              <div>
                <Label htmlFor="pix" className="mb-1 block">Chave Pix</Label>
                <Input
                  id="pix"
                  name="pix"
                  value={form.pix}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  ref={pixInputRef}
                  disabled={!form.pixType} // Disable if pixType is not selected
                  placeholder={!form.pixType ? "Selecione um tipo de chave PIX para preencher" : "Digite a chave PIX"}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {touched.pix && validationErrors.pix && <p className="text-red-500 text-xs mt-1">{validationErrors.pix}</p>}
              </div>
            </fieldset>

             Endereço 
            <fieldset className="border border-gray-300 dark:border-gray-700 p-5 rounded-lg space-y-4">
              <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Endereço</legend>
              <div>
                <Label htmlFor="enderecoRua" className="mb-1 block">Rua</Label>
                <Input id="enderecoRua" name="enderecoRua" value={form.enderecoRua} onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                {touched.enderecoRua && validationErrors.enderecoRua && <p className="text-red-500 text-xs mt-1">{validationErrors.enderecoRua}</p>}
              </div>
              <div>
                <Label htmlFor="enderecoNumero" className="mb-1 block">Número</Label>
                <Input
                  id="enderecoNumero"
                  name="enderecoNumero"
                  value={form.enderecoNumero}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Apenas números"
                />
                {touched.enderecoNumero && validationErrors.enderecoNumero && <p className="text-red-500 text-xs mt-1">{validationErrors.enderecoNumero}</p>}
              </div>
              <div>
                <Label htmlFor="enderecoBairro" className="mb-1 block">Bairro</Label>
                <Input id="enderecoBairro" name="enderecoBairro" value={form.enderecoBairro} onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                {touched.enderecoBairro && validationErrors.enderecoBairro && <p className="text-red-500 text-xs mt-1">{validationErrors.enderecoBairro}</p>}
              </div>
              <div>
                <Label htmlFor="enderecoCidade" className="mb-1 block">Cidade</Label>
                <Input id="enderecoCidade" name="enderecoCidade" value={form.enderecoCidade} onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                {touched.enderecoCidade && validationErrors.enderecoCidade && <p className="text-red-500 text-xs mt-1">{validationErrors.enderecoCidade}</p>}
              </div>
              <div>
                <Label htmlFor="enderecoComplemento" className="mb-1 block">Complemento (Opcional)</Label>
                <Input id="enderecoComplemento" name="enderecoComplemento" value={form.enderecoComplemento} onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                {touched.enderecoComplemento && validationErrors.enderecoComplemento && <p className="text-red-500 text-xs mt-1">{validationErrors.enderecoComplemento}</p>}
              </div>
              <div>
                <Label htmlFor="cep" className="mb-1 block">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  value={form.cep}
                  onInput={(e: ChangeEvent<HTMLInputElement>) => { e.target.value = formatCep(e.target.value); handleChange(e); }}
                  onBlur={handleBlur}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Ex: XXXXX-XXX"
                />
                {touched.cep && validationErrors.cep && <p className="text-red-500 text-xs mt-1">{validationErrors.cep}</p>}
              </div>
            </fieldset>

             Contato 
            <fieldset className="border border-gray-300 dark:border-gray-700 p-5 rounded-lg space-y-4">
              <legend className="text-base font-semibold text-gray-700 dark:text-gray-300 px-2">Contato</legend>
              <div>
                <Label htmlFor="celular" className="mb-1 block">Celular (Principal)</Label>
                <Input
                  id="celular"
                  name="celular"
                  value={form.celular}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="(XX) X XXXX-XXXX"
                />
                {touched.celular && validationErrors.celular && <p className="text-red-500 text-xs mt-1">{validationErrors.celular}</p>}
              </div>
              <div>
                <Label htmlFor="celular2" className="mb-1 block">Celular (Opcional)</Label>
                <Input
                  id="celular2"
                  name="celular2"
                  value={form.celular2}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="(XX) X XXXX-XXXX"
                />
                {touched.celular2 && validationErrors.celular2 && <p className="text-red-500 text-xs mt-1">{validationErrors.celular2}</p>}
              </div>
              <div>
                <Label htmlFor="email" className="mb-1 block">Email</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                {touched.email && validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
              </div>
            </fieldset>

             Termo de Privacidade 
            <div className="text-sm text-muted-foreground text-center p-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              As informações fornecidas neste formulário são confidenciais e utilizadas exclusivamente para fins de cadastro e verificação. Elas não serão compartilhadas com terceiros sem consentimento explícito.
            </div>

            <div className="flex items-center space-x-2 justify-center">
              <input
                type="checkbox"
                id="termoPrivacidade"
                name="termoPrivacidade"
                checked={form.termoPrivacidade}
                onChange={handleChange}
                onBlur={handleBlur}
                className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-500"
              />
              <Label htmlFor="termoPrivacidade" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Declaro que todas as informações fornecidas são verdadeiras.
              </Label>
            </div>
            {touched.termoPrivacidade && validationErrors.termoPrivacidade && <p className="text-red-500 text-xs mt-1 text-center">{validationErrors.termoPrivacidade}</p>}

             General status message before submit button 
            {statusMessage.message && (
              <Alert variant={statusMessage.type === "success" ? "default" : "destructive"} className="mt-4">
                <AlertTitle>{statusMessage.type === "success" ? "Sucesso!" : "Erro!"}</AlertTitle>
                <AlertDescription>{statusMessage.message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || hasErrors}
            >
              {isSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          </form>*/}
        </CardContent>
      </Card>

      <MessageModal
        message={modalMessage.message}
        type={modalMessage.type}
        onClose={closeModal}
      /> 

      
    </div>
  );
}
