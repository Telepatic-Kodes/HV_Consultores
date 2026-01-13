// Tipos generados automáticamente por Supabase
// Proyecto: hv-consultores-app
// Fecha: 2026-01-11

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          accion: string
          created_at: string | null
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          id: string
          ip_address: unknown
          registro_id: string | null
          tabla: string | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string | null
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          ip_address?: unknown
          registro_id?: string | null
          tabla?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string | null
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          ip_address?: unknown
          registro_id?: string | null
          tabla?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_definiciones: {
        Row: {
          activo: boolean | null
          config_default: Json | null
          created_at: string | null
          descripcion: string | null
          frecuencia_default: string | null
          id: string
          nombre: string
          portal: string
        }
        Insert: {
          activo?: boolean | null
          config_default?: Json | null
          created_at?: string | null
          descripcion?: string | null
          frecuencia_default?: string | null
          id?: string
          nombre: string
          portal: string
        }
        Update: {
          activo?: boolean | null
          config_default?: Json | null
          created_at?: string | null
          descripcion?: string | null
          frecuencia_default?: string | null
          id?: string
          nombre?: string
          portal?: string
        }
        Relationships: []
      }
      bot_jobs: {
        Row: {
          bot_id: string
          cliente_id: string | null
          completed_at: string | null
          config_override: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          resultado: Json | null
          retry_count: number | null
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["bot_job_status"] | null
          triggered_by: string | null
          triggered_by_user: string | null
        }
        Insert: {
          bot_id: string
          cliente_id?: string | null
          completed_at?: string | null
          config_override?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          resultado?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["bot_job_status"] | null
          triggered_by?: string | null
          triggered_by_user?: string | null
        }
        Update: {
          bot_id?: string
          cliente_id?: string | null
          completed_at?: string | null
          config_override?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          resultado?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["bot_job_status"] | null
          triggered_by?: string | null
          triggered_by_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_jobs_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_definiciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_jobs_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_jobs_triggered_by_user_fkey"
            columns: ["triggered_by_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_logs: {
        Row: {
          id: string
          job_id: string
          mensaje: string
          metadata: Json | null
          nivel: string | null
          paso: string | null
          screenshot_url: string | null
          timestamp: string | null
        }
        Insert: {
          id?: string
          job_id: string
          mensaje: string
          metadata?: Json | null
          nivel?: string | null
          paso?: string | null
          screenshot_url?: string | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          job_id?: string
          mensaje?: string
          metadata?: Json | null
          nivel?: string | null
          paso?: string | null
          screenshot_url?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "bot_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_feedback: {
        Row: {
          comentario: string | null
          created_at: string | null
          id: string
          mensaje_id: string
          rating: number | null
          usuario_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          mensaje_id: string
          rating?: number | null
          usuario_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          mensaje_id?: string
          rating?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_feedback_mensaje_id_fkey"
            columns: ["mensaje_id"]
            isOneToOne: false
            referencedRelation: "chat_mensajes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_feedback_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_mensajes: {
        Row: {
          contenido: string
          created_at: string | null
          fuentes: Json | null
          id: string
          latencia_ms: number | null
          modelo_usado: string | null
          rol: string
          sesion_id: string
          tokens_input: number | null
          tokens_output: number | null
        }
        Insert: {
          contenido: string
          created_at?: string | null
          fuentes?: Json | null
          id?: string
          latencia_ms?: number | null
          modelo_usado?: string | null
          rol: string
          sesion_id: string
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Update: {
          contenido?: string
          created_at?: string | null
          fuentes?: Json | null
          id?: string
          latencia_ms?: number | null
          modelo_usado?: string | null
          rol?: string
          sesion_id?: string
          tokens_input?: number | null
          tokens_output?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_mensajes_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "chat_sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sesiones: {
        Row: {
          activa: boolean | null
          created_at: string | null
          id: string
          titulo: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          id?: string
          titulo?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          id?: string
          titulo?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sesiones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clasificaciones_ml: {
        Row: {
          confidence: number
          created_at: string | null
          cuenta_predicha_id: string
          documento_id: string
          features_input: Json | null
          id: string
          modelo_version: string
          ranking: number
          shap_values: Json | null
        }
        Insert: {
          confidence: number
          created_at?: string | null
          cuenta_predicha_id: string
          documento_id: string
          features_input?: Json | null
          id?: string
          modelo_version: string
          ranking: number
          shap_values?: Json | null
        }
        Update: {
          confidence?: number
          created_at?: string | null
          cuenta_predicha_id?: string
          documento_id?: string
          features_input?: Json | null
          id?: string
          modelo_version?: string
          ranking?: number
          shap_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "clasificaciones_ml_cuenta_predicha_id_fkey"
            columns: ["cuenta_predicha_id"]
            isOneToOne: false
            referencedRelation: "cuentas_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clasificaciones_ml_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          activo: boolean | null
          comuna: string | null
          contador_asignado_id: string | null
          created_at: string | null
          direccion: string | null
          giro: string | null
          id: string
          nombre_fantasia: string | null
          nubox_id: string | null
          razon_social: string
          regimen_tributario: Database["public"]["Enums"]["regimen_tributario"] | null
          region: string | null
          rut: string
          tasa_ppm: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          comuna?: string | null
          contador_asignado_id?: string | null
          created_at?: string | null
          direccion?: string | null
          giro?: string | null
          id?: string
          nombre_fantasia?: string | null
          nubox_id?: string | null
          razon_social: string
          regimen_tributario?: Database["public"]["Enums"]["regimen_tributario"] | null
          region?: string | null
          rut: string
          tasa_ppm?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          comuna?: string | null
          contador_asignado_id?: string | null
          created_at?: string | null
          direccion?: string | null
          giro?: string | null
          id?: string
          nombre_fantasia?: string | null
          nubox_id?: string | null
          razon_social?: string
          regimen_tributario?: Database["public"]["Enums"]["regimen_tributario"] | null
          region?: string | null
          rut?: string
          tasa_ppm?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_contador_asignado_id_fkey"
            columns: ["contador_asignado_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_sistema: {
        Row: {
          clave: string
          descripcion: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
          valor: Json
        }
        Insert: {
          clave: string
          descripcion?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          valor: Json
        }
        Update: {
          clave?: string
          descripcion?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_sistema_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credenciales_portales: {
        Row: {
          activo: boolean | null
          cliente_id: string
          created_at: string | null
          datos_adicionales: Json | null
          id: string
          password_encriptado: string
          portal: string
          ultima_validacion: string | null
          updated_at: string | null
          usuario_encriptado: string
          validacion_exitosa: boolean | null
        }
        Insert: {
          activo?: boolean | null
          cliente_id: string
          created_at?: string | null
          datos_adicionales?: Json | null
          id?: string
          password_encriptado: string
          portal: string
          ultima_validacion?: string | null
          updated_at?: string | null
          usuario_encriptado: string
          validacion_exitosa?: boolean | null
        }
        Update: {
          activo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          datos_adicionales?: Json | null
          id?: string
          password_encriptado?: string
          portal?: string
          ultima_validacion?: string | null
          updated_at?: string | null
          usuario_encriptado?: string
          validacion_exitosa?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "credenciales_portales_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas_contables: {
        Row: {
          activa: boolean | null
          codigo: string
          cuenta_padre_id: string | null
          es_cuenta_mayor: boolean | null
          id: string
          nivel: number | null
          nombre: string
          plan_cuenta_id: string
          tipo: string | null
        }
        Insert: {
          activa?: boolean | null
          codigo: string
          cuenta_padre_id?: string | null
          es_cuenta_mayor?: boolean | null
          id?: string
          nivel?: number | null
          nombre: string
          plan_cuenta_id: string
          tipo?: string | null
        }
        Update: {
          activa?: boolean | null
          codigo?: string
          cuenta_padre_id?: string | null
          es_cuenta_mayor?: boolean | null
          id?: string
          nivel?: number | null
          nombre?: string
          plan_cuenta_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cuentas_contables_cuenta_padre_id_fkey"
            columns: ["cuenta_padre_id"]
            isOneToOne: false
            referencedRelation: "cuentas_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuentas_contables_plan_cuenta_id_fkey"
            columns: ["plan_cuenta_id"]
            isOneToOne: false
            referencedRelation: "planes_cuenta"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          clasificado_at: string | null
          clasificado_por: string | null
          cliente_id: string
          confidence_score: number | null
          created_at: string | null
          cuenta_final_id: string | null
          cuenta_sugerida_id: string | null
          es_activo_fijo: boolean | null
          es_compra: boolean
          fecha_emision: string
          folio: string
          giro_emisor: string | null
          glosa: string | null
          id: string
          monto_iva: number | null
          monto_neto: number | null
          monto_total: number | null
          nubox_id: string | null
          periodo: string
          razon_social_emisor: string | null
          rut_emisor: string
          status: Database["public"]["Enums"]["documento_status"] | null
          tipo_documento: string
          updated_at: string | null
        }
        Insert: {
          clasificado_at?: string | null
          clasificado_por?: string | null
          cliente_id: string
          confidence_score?: number | null
          created_at?: string | null
          cuenta_final_id?: string | null
          cuenta_sugerida_id?: string | null
          es_activo_fijo?: boolean | null
          es_compra: boolean
          fecha_emision: string
          folio: string
          giro_emisor?: string | null
          glosa?: string | null
          id?: string
          monto_iva?: number | null
          monto_neto?: number | null
          monto_total?: number | null
          nubox_id?: string | null
          periodo: string
          razon_social_emisor?: string | null
          rut_emisor: string
          status?: Database["public"]["Enums"]["documento_status"] | null
          tipo_documento: string
          updated_at?: string | null
        }
        Update: {
          clasificado_at?: string | null
          clasificado_por?: string | null
          cliente_id?: string
          confidence_score?: number | null
          created_at?: string | null
          cuenta_final_id?: string | null
          cuenta_sugerida_id?: string | null
          es_activo_fijo?: boolean | null
          es_compra?: boolean
          fecha_emision?: string
          folio?: string
          giro_emisor?: string | null
          glosa?: string | null
          id?: string
          monto_iva?: number | null
          monto_neto?: number | null
          monto_total?: number | null
          nubox_id?: string | null
          periodo?: string
          razon_social_emisor?: string | null
          rut_emisor?: string
          status?: Database["public"]["Enums"]["documento_status"] | null
          tipo_documento?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cuenta_final_id_fkey"
            columns: ["cuenta_final_id"]
            isOneToOne: false
            referencedRelation: "cuentas_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cuenta_sugerida_id_fkey"
            columns: ["cuenta_sugerida_id"]
            isOneToOne: false
            referencedRelation: "cuentas_contables"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_conocimiento: {
        Row: {
          activo: boolean | null
          categoria: string
          contenido: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          titulo: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          contenido: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          titulo: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          contenido?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          titulo?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      f29_calculos: {
        Row: {
          aprobado_at: string | null
          aprobado_por: string | null
          cliente_id: string
          created_at: string | null
          enviado_sii_at: string | null
          folio_sii: string | null
          id: string
          impuesto_unico: number | null
          periodo: string
          ppm_determinado: number | null
          remanente_actualizado: number | null
          remanente_anterior: number | null
          retenciones_honorarios: number | null
          status: Database["public"]["Enums"]["f29_status"] | null
          total_a_pagar: number | null
          total_credito_fiscal: number | null
          total_debito_fiscal: number | null
          updated_at: string | null
        }
        Insert: {
          aprobado_at?: string | null
          aprobado_por?: string | null
          cliente_id: string
          created_at?: string | null
          enviado_sii_at?: string | null
          folio_sii?: string | null
          id?: string
          impuesto_unico?: number | null
          periodo: string
          ppm_determinado?: number | null
          remanente_actualizado?: number | null
          remanente_anterior?: number | null
          retenciones_honorarios?: number | null
          status?: Database["public"]["Enums"]["f29_status"] | null
          total_a_pagar?: number | null
          total_credito_fiscal?: number | null
          total_debito_fiscal?: number | null
          updated_at?: string | null
        }
        Update: {
          aprobado_at?: string | null
          aprobado_por?: string | null
          cliente_id?: string
          created_at?: string | null
          enviado_sii_at?: string | null
          folio_sii?: string | null
          id?: string
          impuesto_unico?: number | null
          periodo?: string
          ppm_determinado?: number | null
          remanente_actualizado?: number | null
          remanente_anterior?: number | null
          retenciones_honorarios?: number | null
          status?: Database["public"]["Enums"]["f29_status"] | null
          total_a_pagar?: number | null
          total_credito_fiscal?: number | null
          total_debito_fiscal?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "f29_calculos_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "f29_calculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      f29_codigos: {
        Row: {
          cantidad_documentos: number | null
          codigo: number
          descripcion: string | null
          detalle: Json | null
          f29_calculo_id: string
          fuente: string | null
          id: string
          monto_iva: number | null
          monto_neto: number | null
        }
        Insert: {
          cantidad_documentos?: number | null
          codigo: number
          descripcion?: string | null
          detalle?: Json | null
          f29_calculo_id: string
          fuente?: string | null
          id?: string
          monto_iva?: number | null
          monto_neto?: number | null
        }
        Update: {
          cantidad_documentos?: number | null
          codigo?: number
          descripcion?: string | null
          detalle?: Json | null
          f29_calculo_id?: string
          fuente?: string | null
          id?: string
          monto_iva?: number | null
          monto_neto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "f29_codigos_f29_calculo_id_fkey"
            columns: ["f29_calculo_id"]
            isOneToOne: false
            referencedRelation: "f29_calculos"
            referencedColumns: ["id"]
          },
        ]
      }
      f29_validaciones: {
        Row: {
          codigo_validacion: string
          created_at: string | null
          descripcion: string
          diferencia: number | null
          f29_calculo_id: string
          id: string
          mensaje: string | null
          resultado: Database["public"]["Enums"]["validacion_resultado"]
          valor_calculado: number | null
          valor_esperado: number | null
        }
        Insert: {
          codigo_validacion: string
          created_at?: string | null
          descripcion: string
          diferencia?: number | null
          f29_calculo_id: string
          id?: string
          mensaje?: string | null
          resultado: Database["public"]["Enums"]["validacion_resultado"]
          valor_calculado?: number | null
          valor_esperado?: number | null
        }
        Update: {
          codigo_validacion?: string
          created_at?: string | null
          descripcion?: string
          diferencia?: number | null
          f29_calculo_id?: string
          id?: string
          mensaje?: string | null
          resultado?: Database["public"]["Enums"]["validacion_resultado"]
          valor_calculado?: number | null
          valor_esperado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "f29_validaciones_f29_calculo_id_fkey"
            columns: ["f29_calculo_id"]
            isOneToOne: false
            referencedRelation: "f29_calculos"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_clasificacion: {
        Row: {
          comentario: string | null
          created_at: string | null
          cuenta_correcta_id: string
          cuenta_predicha_id: string
          documento_id: string
          id: string
          usado_reentrenamiento: boolean | null
          usuario_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          cuenta_correcta_id: string
          cuenta_predicha_id: string
          documento_id: string
          id?: string
          usado_reentrenamiento?: boolean | null
          usuario_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          cuenta_correcta_id?: string
          cuenta_predicha_id?: string
          documento_id?: string
          id?: string
          usado_reentrenamiento?: boolean | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_clasificacion_cuenta_correcta_id_fkey"
            columns: ["cuenta_correcta_id"]
            isOneToOne: false
            referencedRelation: "cuentas_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_clasificacion_cuenta_predicha_id_fkey"
            columns: ["cuenta_predicha_id"]
            isOneToOne: false
            referencedRelation: "cuentas_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_clasificacion_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_clasificacion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string | null
          id: string
          leida: boolean | null
          link: string | null
          mensaje: string
          tipo: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          link?: string | null
          mensaje: string
          tipo: string
          titulo: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          link?: string | null
          mensaje?: string
          tipo?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_cuenta: {
        Row: {
          activo: boolean | null
          cliente_id: string
          created_at: string | null
          id: string
          nombre: string
          version: number | null
        }
        Insert: {
          activo?: boolean | null
          cliente_id: string
          created_at?: string | null
          id?: string
          nombre: string
          version?: number | null
        }
        Update: {
          activo?: boolean | null
          cliente_id?: string
          created_at?: string | null
          id?: string
          nombre?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "planes_cuenta_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean | null
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          id: string
          nombre_completo: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          id: string
          nombre_completo: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          id?: string
          nombre_completo?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          permisos: Json | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          permisos?: Json | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          permisos?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_assigned_clients: { Args: { user_uuid: string }; Returns: string[] }
      get_chat_context: {
        Args: {
          categorias?: string[]
          max_tokens?: number
          query_embedding: string
        }
        Returns: {
          contexto: string
          fuentes: Json
        }[]
      }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
      search_knowledge_base: {
        Args: {
          filter_categoria?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          categoria: string
          contenido: string
          id: string
          metadata: Json
          similarity: number
          titulo: string
        }[]
      }
    }
    Enums: {
      bot_job_status: "pendiente" | "ejecutando" | "completado" | "fallido" | "cancelado"
      documento_status: "pendiente" | "clasificado" | "revisado" | "aprobado" | "exportado"
      f29_status: "borrador" | "calculado" | "validado" | "aprobado" | "enviado"
      regimen_tributario: "14A" | "14D" | "14D_N3" | "14D_N8"
      user_role_type: "admin" | "jefe_contabilidad" | "contador" | "coordinador_gp" | "asistente"
      validacion_resultado: "ok" | "warning" | "error"
    }
    CompositeTypes: Record<string, never>
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Convenience type aliases
export type Profile = Tables<'profiles'>
export type Cliente = Tables<'clientes'>
export type Documento = Tables<'documentos'>
export type F29Calculo = Tables<'f29_calculos'>
export type F29Codigo = Tables<'f29_codigos'>
export type BotJob = Tables<'bot_jobs'>
export type ChatSesion = Tables<'chat_sesiones'>
export type ChatMensaje = Tables<'chat_mensajes'>
export type Notificacion = Tables<'notificaciones'>
export type AuditLog = Tables<'audit_logs'>
