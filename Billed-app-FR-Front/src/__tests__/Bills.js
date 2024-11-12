/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js";
import { formatDate } from "../app/format.js";

describe("Given I am connected as an employee", () => {

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      // Attendre que l'icône des factures soit visible
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      // Attendre que l'icône du mail soit visible
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')

      // Vérifier que l'icône de facture est surlignée (classe "active-icon" présente)
      expect(windowIcon.classList.contains('active-icon')).toBe(true);
      // Vérifier que l'icône du mail n'est pas surlignée
      expect(mailIcon.classList.contains('active-icon')).toBe(false)
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => (new Date(a.date) < new Date(b.date) ? -1 : 1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

      // Test pour handleClickNewBill
      test("When I click on the new bill button, it should navigate to NewBill page", () => {
        const onNavigate = jest.fn();
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        });

        // Simulation du clic sur le bouton "Nouvelle facture"
        const buttonNewBill = screen.getByTestId("btn-new-bill");
        buttonNewBill.addEventListener("click", billsContainer.handleClickNewBill);
        fireEvent.click(buttonNewBill);

        // Vérification que la navigation vers la page NewBill est déclenchée
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.NewBill);
      });

      // Test pour handleClickIconEye
      test("When I click on the eye icon, it should open the modal with the bill image", async () => {
        document.body.innerHTML = BillsUI({ data: await mockStore.bills().list() });

        // Simulation de la fonction modal de jQuery
        $.fn.modal = jest.fn();
        
        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage
        });

        // Simulation du clic sur l'icône "œil"
        const iconEye = screen.getAllByTestId("icon-eye")[0];
        iconEye.setAttribute("data-bill-url", "https://test.com/bill.jpg");
        billsContainer.handleClickIconEye(iconEye);

        // Vérification que la modale s'affiche et que l'image est correcte
        const modalImage = document.querySelector(".bill-proof-container img");
        expect(modalImage.src).toBe("https://test.com/bill.jpg");
      });

      // Test d'intégration pour getBills
      test("getBills should call store.bills().list and return sorted bills", async () => {

        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage
        });
      
        const result = await billsContainer.getBills();
   
        // Vérifiez que la sortie contient bien 4 éléments
        expect(result).toHaveLength(4);
        // Vérifiez que les factures sont triées dans l'ordre décroissant par date
        expect(result[0].date).toBe(formatDate("2004-04-04"));
        expect(result[1].date).toBe(formatDate("2003-03-03"));
        expect(result[2].date).toBe(formatDate("2002-02-02"));
        expect(result[3].date).toBe(formatDate("2001-01-01"));
      });
  });
});
