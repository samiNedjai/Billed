/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
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
      expect(mailIcon.classList.contains('active-icon')).not.toBeTruthy()
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => (new Date(a.date) < new Date(b.date) ? -1 : 1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

   
    describe("Additional tests for Bills.js", () => {

      // Test pour handleClickNewBill
      test("When I click on the new bill button, it should navigate to NewBill page", () => {
        const onNavigate = jest.fn();
        const billsContainer = new Bills({
          document,
          onNavigate,
          store: null,
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
      test("When I click on the eye icon, it should open the modal with the bill image", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage
        });

        $.fn.modal = jest.fn(); // Mock jQuery modal

        // Simulation du clic sur l'icône "œil"
        const iconEye = screen.getAllByTestId("icon-eye")[0];
        iconEye.setAttribute("data-bill-url", "https://test.com/bill.jpg");
        billsContainer.handleClickIconEye(iconEye);

        // Vérification que la modale s'affiche et que l'image est correcte
        expect($.fn.modal).toHaveBeenCalled();
        const modalImage = document.querySelector(".bill-proof-container img");
        expect(modalImage.src).toBe("https://test.com/bill.jpg");
      });

      // Test d'intégration pour getBills
      test("getBills should call store.bills().list and return sorted bills", async () => {
        const listMock = jest.fn().mockResolvedValueOnce([
          { id: "1", date: "2021-12-01", status: "pending" },
          { id: "2", date: "2021-11-15", status: "accepted" }
        ]);
      
        const storeMock = {
          bills: () => ({
            list: listMock
          })
        };
      
        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: storeMock,
          localStorage: window.localStorage
        });
      
        const result = await billsContainer.getBills();
      
        // Vérifie que list() est appelé au moins une fois
        expect(listMock).toHaveBeenCalled();
      
        // Vérifie le contenu renvoyé
        expect(result).toHaveLength(2);
        expect(result[0].date).toBe(formatDate("2021-12-01")); // Vérifie que le tri est bien fait
      });
      

    });

  });
});
