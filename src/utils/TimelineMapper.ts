export interface Segment {
  start: number;
  end: number;
  duration: number;
}

export class TimelineMapper {
  private segments: Segment[];

  constructor(segments: Segment[]) {
    this.segments = segments;
  }

  /**
   * Converte um timestamp original para o timestamp na timeline editada.
   * Retorna null se o timestamp original foi cortado.
   */
  mapOriginalToEdited(originalTime: number): number | null {
    let editedTime = 0;
    
    for (const segment of this.segments) {
      if (originalTime < segment.start) {
        // O tempo original está em um trecho removido antes deste segmento
        return null;
      }
      
      if (originalTime <= segment.end) {
        // O tempo original está dentro deste segmento
        return editedTime + (originalTime - segment.start);
      }
      
      // O tempo original está após este segmento, soma a duração do segmento mantido
      editedTime += segment.duration;
    }
    
    return null; // O tempo original está após o último segmento
  }

  /**
   * Retorna se um intervalo (start, end) está total ou parcialmente presente na timeline editada.
   */
  mapInterval(originalStart: number, originalEnd: number): { start: number; end: number } | null {
    const mappedStart = this.mapOriginalToEdited(originalStart);
    const mappedEnd = this.mapOriginalToEdited(originalEnd);
    
    if (mappedStart !== null && mappedEnd !== null) {
      return { start: mappedStart, end: mappedEnd };
    }
    
    // Se um dos boundaries foi cortado, precisamos de uma lógica mais complexa ou simplificada
    // Para VideoFlow, geralmente queremos saber se o intervalo sobrepõe algum segmento mantido.
    
    // Simplificação para V1: se o início ou fim estiverem fora, retornamos null ou o primeiro ponto válido.
    // Mas para legendas e zooms, geralmente o boundary original respeita a fala.
    
    if (mappedStart === null) {
      // Tenta encontrar o primeiro segmento que começa após originalStart
      const firstValidSegment = this.segments.find(s => s.start >= originalStart && s.start < originalEnd);
      if (!firstValidSegment) return null;
      
      const newMappedStart = this.mapOriginalToEdited(firstValidSegment.start)!;
      const newMappedEnd = mappedEnd !== null ? mappedEnd : this.mapOriginalToEdited(Math.min(originalEnd, firstValidSegment.end))!;
      
      return { start: newMappedStart, end: newMappedEnd };
    }
    
    if (mappedEnd === null) {
      // O fim foi cortado, pega o fim do último segmento que contém o início
      const lastValidSegment = [...this.segments].reverse().find(s => s.end <= originalEnd && s.end > originalStart);
      if (!lastValidSegment) return null;
      
      return { start: mappedStart, end: this.mapOriginalToEdited(lastValidSegment.end)! };
    }

    return null;
  }
}
