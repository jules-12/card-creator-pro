import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Contributor } from '@/types/contributor';
import BeninFlagStripe from './BeninFlagStripe';

interface ProfessionalCardProps {
  contributor: Contributor;
}

const ProfessionalCard = forwardRef<HTMLDivElement, ProfessionalCardProps>(
  ({ contributor }, ref) => {
    // Générer les données du QR Code
    const qrData = [
      `N° NPC: ${contributor.npc}`,
      `Nom: ${contributor.nom}`,
      `Prénoms: ${contributor.prenoms}`,
      `Tél: ${contributor.telephone}`,
      `Arr.: ${contributor.arrondissement}`,
    ].join('\n');

    return (
      <div
        ref={ref}
        className="professional-card flex flex-col"
        style={{
          width: '10cm',
          height: '7cm',
          fontFamily: "'Open Sans', sans-serif",
        }}
      >
        {/* Bande supérieure du drapeau */}
        <BeninFlagStripe height="0.35cm" />

        {/* En-tête bleu avec logos */}
        <div className="card-header px-3 py-1.5 flex items-center justify-between">
          {/* Logo République (placeholder) */}
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">🏛️</span>
            </div>
          </div>

          {/* Titres centraux */}
          <div className="flex-1 text-center">
            <h1 className="card-title-main text-sm leading-tight">
              RÉPUBLIQUE DU BÉNIN
            </h1>
            <h2 className="card-subtitle text-xs leading-tight">
              MAIRIE DE COTONOU
            </h2>
            <p className="text-white text-[9px] font-medium">
              SECTEUR DES TAXI-URBAIN
            </p>
          </div>

          {/* Logo Ville (placeholder) */}
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">🌴</span>
            </div>
          </div>
        </div>

        {/* Titre de la carte */}
        <div className="text-center py-1">
          <h3 className="card-section-title text-sm tracking-wide">
            CARTE PROFESSIONNELLE DU CONTRIBUABLE
          </h3>
        </div>

        {/* Corps de la carte */}
        <div className="flex-1 px-4 pb-2 flex">
          {/* Informations */}
          <div className="flex-1 flex flex-col justify-center space-y-0.5">
            <div className="flex items-baseline">
              <span className="card-field-label text-sm w-28">N° NPC:</span>
              <span className="card-field-value text-sm">{contributor.npc}</span>
            </div>
            <div className="flex items-baseline">
              <span className="card-field-label text-sm w-28">Nom:</span>
              <span className="card-field-value text-sm">{contributor.nom}</span>
            </div>
            <div className="flex items-baseline">
              <span className="card-field-label text-sm w-28">Prénoms:</span>
              <span className="card-field-value text-sm">{contributor.prenoms}</span>
            </div>
            <div className="flex items-baseline">
              <span className="card-field-label text-sm w-28">Tel:</span>
              <span className="card-field-value text-sm">{contributor.telephone}</span>
            </div>
            <div className="flex items-baseline">
              <span className="card-field-label text-sm w-28">Arrondissement:</span>
              <span className="card-field-value text-sm">{contributor.arrondissement}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex items-center justify-center pl-2">
            <div className="bg-white p-1 rounded shadow-sm">
              <QRCodeSVG
                value={qrData}
                size={80}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="px-3 pb-1">
          <ul className="card-footer-text space-y-0 leading-tight">
            <li className="flex items-start">
              <span className="mr-1">•</span>
              <span>Adresse postale : 03 BP : 1777 Cotonou - BÉNIN .Téléphone : +229 21 30 95 69</span>
            </li>
            <li className="flex items-start">
              <span className="mr-1">•</span>
              <span>E-mail : mairiecotonou.infos@gouv.bj .Site web : www.cotonou.mairie.bj</span>
            </li>
          </ul>
        </div>

        {/* Bande inférieure du drapeau */}
        <BeninFlagStripe height="0.35cm" />
      </div>
    );
  }
);

ProfessionalCard.displayName = 'ProfessionalCard';

export default ProfessionalCard;
