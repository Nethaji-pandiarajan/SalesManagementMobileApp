jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
}));

import { normalizeVehiclePayload } from '../src/services/vehicleService';

describe('vehicleService', () => {
  it('maps UI form values to backend payload fields', () => {
    const payload = normalizeVehiclePayload({
      vehicleNo: 'TN 01 AB 1234',
      vehicleName: 'Tata Ace',
      vehicleOwner: 'John Doe',
      description: 'Delivery van',
      status: 'Active',
    });

    expect(payload).toEqual({
      vehicle_no: 'TN 01 AB 1234',
      vehicle_name: 'Tata Ace',
      vehicle_owner: 'John Doe',
      description: 'Delivery van',
      status: 'ACTIVE',
    });
  });

  it('defaults to active status when status is missing', () => {
    const payload = normalizeVehiclePayload({
      vehicleNo: 'TN 02 CD 5678',
      vehicleName: 'Mahindra Bolero',
    });

    expect(payload.status).toBe('ACTIVE');
  });
});
